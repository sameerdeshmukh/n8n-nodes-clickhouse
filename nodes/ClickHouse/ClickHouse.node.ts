import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { queryFields } from './descriptions/query.description';
import { insertFields } from './descriptions/insert.description';
import { rawFields } from './descriptions/raw.description';
import {
	buildBaseUrl,
	buildAuthHeader,
	buildUrlParams,
	chunkArray,
	parseClickHouseResponse,
	extractClickHouseError,
} from './ClickHouse.helpers';
import type { ClickHouseCredentials, QueryParam } from './ClickHouse.helpers';

export class ClickHouse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ClickHouse',
		name: 'clickHouse',
		icon: 'file:clickhouse.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] }}',
		description: 'Query and insert data using ClickHouse',
		defaults: {
			name: 'ClickHouse',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'clickHouseApi',
				required: true,
			},
		],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Execute Query',
						value: 'executeQuery',
						description: 'Run a SELECT query and return the results',
						action: 'Execute a query',
					},
					{
						name: 'Insert',
						value: 'insert',
						description: 'Insert input items into a ClickHouse table',
						action: 'Insert rows into a table',
					},
					{
						name: 'Execute Raw',
						value: 'executeRaw',
						description:
							'Execute DDL or DML statements (CREATE, ALTER, DROP, TRUNCATE, OPTIMIZE)',
						action: 'Execute a raw DDL or DML statement',
					},
				],
				default: 'executeQuery',
			},
			...queryFields,
			...insertFields,
			...rawFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = (await this.getCredentials('clickHouseApi')) as unknown as ClickHouseCredentials;

		const baseUrl = buildBaseUrl(credentials);
		const authHeader = buildAuthHeader(credentials);

		if (operation === 'executeQuery') {
			for (let i = 0; i < items.length; i++) {
				try {
					let query = this.getNodeParameter('query', i) as string;
					const options = this.getNodeParameter('options', i, {}) as {
						limit?: number;
						querySettings?: string;
					};

					// Build query parameters
					const queryParametersData = this.getNodeParameter('queryParameters', i, {}) as {
						params?: Array<{ name: string; value: string }>;
					};
					const queryParams: QueryParam[] = queryParametersData.params || [];

					// Append LIMIT if not already present
					const limit = options.limit ?? 100;
					if (limit > 0 && !/\blimit\b/i.test(query)) {
						query = `${query.replace(/;\s*$/, '')} LIMIT ${limit}`;
					}

					// Add FORMAT JSONEachRow
					query = `${query.replace(/;\s*$/, '')} FORMAT JSONEachRow`;

					const urlParams = buildUrlParams(
						credentials.database,
						options.querySettings,
						queryParams,
					);

					const response = (await this.helpers.httpRequest({
						method: 'POST',
						url: `${baseUrl}/?${urlParams}`,
						headers: {
							Authorization: authHeader,
							'Content-Type': 'text/plain',
						},
						body: query,
						returnFullResponse: false,
					})) as string;

					const rows = parseClickHouseResponse(response);
					for (const row of rows) {
						returnData.push({
							json: row as IDataObject,
							pairedItem: { item: i },
						});
					}
				} catch (error) {
					const chError = extractClickHouseError(error);
					if (this.continueOnFail()) {
						returnData.push({
							json: { error: chError },
							pairedItem: { item: i },
						});
						continue;
					}
					throw new NodeOperationError(this.getNode(), chError, { itemIndex: i });
				}
			}
		} else if (operation === 'insert') {
			const table = this.getNodeParameter('table', 0) as string;
			const options = this.getNodeParameter('options', 0, {}) as {
				chunkSize?: number;
				database?: string;
			};
			const chunkSize = options.chunkSize ?? 1000;
			const database = options.database || credentials.database;

			// Collect all items' JSON data
			const allRows = items.map((item) => item.json);
			const chunks = chunkArray(allRows, chunkSize);

			for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
				try {
					const chunk = chunks[chunkIndex];
					const ndjson = chunk.map((row) => JSON.stringify(row)).join('\n') + '\n';

					const urlParams = buildUrlParams(database);
					const insertQuery = `INSERT INTO ${table} FORMAT JSONEachRow`;

					await this.helpers.httpRequest({
						method: 'POST',
						url: `${baseUrl}/?${urlParams}&query=${encodeURIComponent(insertQuery)}`,
						headers: {
							Authorization: authHeader,
							'Content-Type': 'application/x-ndjson',
						},
						body: ndjson,
						returnFullResponse: false,
					});
				} catch (error) {
					const chError = extractClickHouseError(error);
					if (this.continueOnFail()) {
						returnData.push({
							json: { error: chError, chunk: chunkIndex },
							pairedItem: { item: 0 },
						});
						continue;
					}
					throw new NodeOperationError(this.getNode(), chError, { itemIndex: 0 });
				}
			}

			// Return the original items on success
			if (returnData.length === 0) {
				returnData.push({
					json: {
						success: true,
						insertedRows: allRows.length,
						table,
					},
					pairedItem: { item: 0 },
				});
			}
		} else if (operation === 'executeRaw') {
			for (let i = 0; i < items.length; i++) {
				try {
					const query = this.getNodeParameter('query', i) as string;
					const options = this.getNodeParameter('options', i, {}) as {
						querySettings?: string;
					};

					const urlParams = buildUrlParams(credentials.database, options.querySettings);

					const response = (await this.helpers.httpRequest({
						method: 'POST',
						url: `${baseUrl}/?${urlParams}`,
						headers: {
							Authorization: authHeader,
							'Content-Type': 'text/plain',
						},
						body: query,
						returnFullResponse: false,
					})) as string;

					returnData.push({
						json: {
							success: true,
							response: response || 'OK',
						},
						pairedItem: { item: i },
					});
				} catch (error) {
					const chError = extractClickHouseError(error);
					if (this.continueOnFail()) {
						returnData.push({
							json: { error: chError },
							pairedItem: { item: i },
						});
						continue;
					}
					throw new NodeOperationError(this.getNode(), chError, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}
