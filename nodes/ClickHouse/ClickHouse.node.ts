import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { queryFields } from './descriptions/query.description';
import { insertFields } from './descriptions/insert.description';
import { rawFields } from './descriptions/raw.description';
import { deleteFields } from './descriptions/delete.description';
import { updateFields } from './descriptions/update.description';
import { listDatabasesFields } from './descriptions/listDatabases.description';
import { listTablesFields } from './descriptions/listTables.description';
import { getTableInfoFields } from './descriptions/getTableInfo.description';
import { createTableFields } from './descriptions/createTable.description';
import {
	buildBaseUrl,
	buildAuthHeader,
	buildUrlParams,
	chunkArray,
	parseClickHouseResponse,
	extractClickHouseError,
	validateIdentifier,
	applyColumnMapping,
	parseQueryStats,
	inferClickHouseType,
	buildCreateTableDDL,
} from './ClickHouse.helpers';
import type { ClickHouseCredentials, ColumnMapping, QueryParam } from './ClickHouse.helpers';

export class ClickHouse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ClickHouse',
		name: 'clickHouse',
		icon: 'file:clickhouse.svg',
		group: ['transform'],
		version: [1, 2],
		subtitle: '={{ $parameter["operation"] }}',
		description: 'Query, insert, update, delete, and manage ClickHouse tables from n8n workflows',
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
						name: 'Create Table',
						value: 'createTable',
						description: 'Create a new table, optionally inferring schema from input',
						action: 'Create a table',
					},
					{
						name: 'Delete Rows',
						value: 'deleteRows',
						description: 'Delete rows from a table using a WHERE clause',
						action: 'Delete rows from a table',
					},
					{
						name: 'Execute Query',
						value: 'executeQuery',
						description: 'Run a SELECT query and return the results',
						action: 'Execute a query',
					},
					{
						name: 'Execute Raw',
						value: 'executeRaw',
						description:
							'Execute DDL or DML statements (CREATE, ALTER, DROP, TRUNCATE, OPTIMIZE)',
						action: 'Execute a raw DDL or DML statement',
					},
					{
						name: 'Get Table Info',
						value: 'getTableInfo',
						description:
							'Get schema, engine, row count, and size information for a table',
						action: 'Get table info',
					},
					{
						name: 'Insert',
						value: 'insert',
						description: 'Insert input items into a ClickHouse table',
						action: 'Insert rows into a table',
					},
					{
						name: 'List Databases',
						value: 'listDatabases',
						description: 'List all databases on the ClickHouse server',
						action: 'List databases',
					},
					{
						name: 'List Tables',
						value: 'listTables',
						description: 'List all tables in a database',
						action: 'List tables',
					},
					{
						name: 'Update Rows',
						value: 'updateRows',
						description: 'Update rows in a table using a WHERE clause',
						action: 'Update rows in a table',
					},
				],
				default: 'executeQuery',
			},
			...queryFields,
			...insertFields,
			...rawFields,
			...deleteFields,
			...updateFields,
			...listDatabasesFields,
			...listTablesFields,
			...getTableInfoFields,
			...createTableFields,
		],
	};

	methods = {
		loadOptions: {
			async getDatabases(
				this: ILoadOptionsFunctions,
			): Promise<INodeListSearchResult['results']> {
				const credentials =
					(await this.getCredentials('clickHouseApi')) as unknown as ClickHouseCredentials;
				const baseUrl = buildBaseUrl(credentials);
				const authHeader = buildAuthHeader(credentials);
				const urlParams = buildUrlParams(credentials.database);

				const response = (await this.helpers.httpRequest({
					method: 'POST',
					url: `${baseUrl}/?${urlParams}`,
					headers: {
						Authorization: authHeader,
						'Content-Type': 'text/plain',
					},
					body: 'SELECT name FROM system.databases ORDER BY name FORMAT JSONEachRow',
					returnFullResponse: false,
				})) as string;

				const rows = parseClickHouseResponse(response);
				return rows.map((row) => ({
					name: row.name as string,
					value: row.name as string,
				}));
			},

			async getTables(
				this: ILoadOptionsFunctions,
			): Promise<INodeListSearchResult['results']> {
				const credentials =
					(await this.getCredentials('clickHouseApi')) as unknown as ClickHouseCredentials;
				const baseUrl = buildBaseUrl(credentials);
				const authHeader = buildAuthHeader(credentials);
				const urlParams = buildUrlParams(credentials.database);

				const response = (await this.helpers.httpRequest({
					method: 'POST',
					url: `${baseUrl}/?${urlParams}`,
					headers: {
						Authorization: authHeader,
						'Content-Type': 'text/plain',
					},
					body: `SELECT name FROM system.tables WHERE database = '${credentials.database.replace(/'/g, "\\'")}' ORDER BY name FORMAT JSONEachRow`,
					returnFullResponse: false,
				})) as string;

				const rows = parseClickHouseResponse(response);
				return rows.map((row) => ({
					name: row.name as string,
					value: row.name as string,
				}));
			},

			async getColumns(
				this: ILoadOptionsFunctions,
			): Promise<INodeListSearchResult['results']> {
				const credentials =
					(await this.getCredentials('clickHouseApi')) as unknown as ClickHouseCredentials;
				const baseUrl = buildBaseUrl(credentials);
				const authHeader = buildAuthHeader(credentials);

				let table = '';
				try {
					table = this.getNodeParameter('table', '') as string;
				} catch {
					return [];
				}
				if (!table) return [];

				const urlParams = buildUrlParams(credentials.database);
				const response = (await this.helpers.httpRequest({
					method: 'POST',
					url: `${baseUrl}/?${urlParams}`,
					headers: {
						Authorization: authHeader,
						'Content-Type': 'text/plain',
					},
					body: `SELECT name, type FROM system.columns WHERE database = '${credentials.database.replace(/'/g, "\\'")}' AND table = '${table.replace(/'/g, "\\'")}' ORDER BY position FORMAT JSONEachRow`,
					returnFullResponse: false,
				})) as string;

				const rows = parseClickHouseResponse(response);
				return rows.map((row) => ({
					name: `${row.name} (${row.type})`,
					value: row.name as string,
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials =
			(await this.getCredentials('clickHouseApi')) as unknown as ClickHouseCredentials;

		const baseUrl = buildBaseUrl(credentials);
		const authHeader = buildAuthHeader(credentials);

		// ── Execute Query ────────────────────────────────────────────────
		if (operation === 'executeQuery') {
			for (let i = 0; i < items.length; i++) {
				try {
					let query = this.getNodeParameter('query', i) as string;
					const options = this.getNodeParameter('options', i, {}) as {
						limit?: number;
						offset?: number;
						includeStats?: boolean;
						queryId?: string;
						querySettings?: string;
					};

					const queryParametersData = this.getNodeParameter(
						'queryParameters',
						i,
						{},
					) as {
						params?: Array<{ name: string; value: string }>;
					};
					const queryParams: QueryParam[] = queryParametersData.params || [];

					// Append LIMIT if not already present
					const limit = Math.max(0, Math.floor(options.limit ?? 100));
					if (limit > 0 && !/\blimit\b/i.test(query)) {
						query = `${query.replace(/;\s*$/, '')} LIMIT ${limit}`;
					}

					// Append OFFSET if not already present
					const offset = Math.max(0, Math.floor(options.offset ?? 0));
					if (offset > 0 && !/\boffset\b/i.test(query)) {
						query = `${query.replace(/;\s*$/, '')} OFFSET ${offset}`;
					}

					// Add FORMAT JSONEachRow
					query = `${query.replace(/;\s*$/, '')} FORMAT JSONEachRow`;

					const urlParams = buildUrlParams(
						credentials.database,
						options.querySettings,
						queryParams,
					);

					// Build URL with optional query_id
					let url = `${baseUrl}/?${urlParams}`;
					if (options.queryId) {
						url += `&query_id=${encodeURIComponent(options.queryId)}`;
					}

					const rawResponse = await this.helpers.httpRequest({
						method: 'POST',
						url,
						headers: {
							Authorization: authHeader,
							'Content-Type': 'text/plain',
						},
						body: query,
						returnFullResponse: options.includeStats ? true : false,
					});

					let responseBody: string;
					let stats: Record<string, unknown> | null = null;

					if (options.includeStats && rawResponse && typeof rawResponse === 'object') {
						const fullResp = rawResponse as {
							body: string;
							headers: Record<string, string>;
						};
						responseBody = fullResp.body;
						stats = parseQueryStats(
							fullResp.headers?.['x-clickhouse-summary'],
						) as unknown as Record<string, unknown>;
					} else {
						responseBody = rawResponse as string;
					}

					const rows = parseClickHouseResponse(responseBody);
					for (const row of rows) {
						const json: IDataObject = { ...(row as IDataObject) };
						if (stats) {
							json._stats = stats as IDataObject;
						}
						if (options.queryId) {
							json._queryId = options.queryId;
						}
						returnData.push({
							json,
							pairedItem: { item: i },
						});
					}

					// If no rows but stats requested, still output stats
					if (rows.length === 0 && (stats || options.queryId)) {
						const json: IDataObject = {};
						if (stats) json._stats = stats as IDataObject;
						if (options.queryId) json._queryId = options.queryId;
						returnData.push({ json, pairedItem: { item: i } });
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

			// ── Insert ─────────────────────────────────────────────────────
		} else if (operation === 'insert') {
			const table = this.getNodeParameter('table', 0) as string;
			const options = this.getNodeParameter('options', 0, {}) as {
				chunkSize?: number;
				database?: string;
				columnMapping?: { mappings?: ColumnMapping[] };
				onlyMapped?: boolean;
			};

			validateIdentifier(table, 'table name');

			const chunkSize = Math.max(
				1,
				Math.min(Math.floor(options.chunkSize ?? 1000), 100_000),
			);
			const database = options.database || credentials.database;

			// Apply column mapping if configured
			const mappings = options.columnMapping?.mappings || [];
			const onlyMapped = options.onlyMapped ?? false;

			const allRows = items.map((item) =>
				applyColumnMapping(
					item.json as Record<string, unknown>,
					mappings,
					onlyMapped,
				),
			);
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

			if (returnData.length === 0) {
				returnData.push({
					json: { success: true, insertedRows: allRows.length },
					pairedItem: { item: 0 },
				});
			}

			// ── Delete Rows ────────────────────────────────────────────────
		} else if (operation === 'deleteRows') {
			for (let i = 0; i < items.length; i++) {
				try {
					const table = this.getNodeParameter('table', i) as string;
					const where = this.getNodeParameter('where', i) as string;
					const options = this.getNodeParameter('options', i, {}) as {
						database?: string;
						querySettings?: string;
					};

					validateIdentifier(table, 'table name');
					if (!where.trim()) {
						throw new Error(
							'WHERE clause is required for DELETE. To delete all rows, use TRUNCATE via Execute Raw.',
						);
					}

					const database = options.database || credentials.database;
					const query = `DELETE FROM ${table} WHERE ${where}`;

					// Add allow_experimental_lightweight_delete to settings if not present
					let settingsStr = options.querySettings || '{}';
					try {
						const parsed = JSON.parse(settingsStr) as Record<string, unknown>;
						if (!('allow_experimental_lightweight_delete' in parsed)) {
							parsed['allow_experimental_lightweight_delete'] = 1;
						}
						settingsStr = JSON.stringify(parsed);
					} catch {
						settingsStr =
							'{"allow_experimental_lightweight_delete": 1}';
					}

					const urlParams = buildUrlParams(database, settingsStr);

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
							operation: 'delete',
							table,
							where,
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

			// ── Update Rows ────────────────────────────────────────────────
		} else if (operation === 'updateRows') {
			for (let i = 0; i < items.length; i++) {
				try {
					const table = this.getNodeParameter('table', i) as string;
					const where = this.getNodeParameter('where', i) as string;
					const columnsData = this.getNodeParameter('columns', i, {}) as {
						values?: Array<{ column: string; value: string }>;
					};
					const options = this.getNodeParameter('options', i, {}) as {
						database?: string;
						querySettings?: string;
					};

					validateIdentifier(table, 'table name');

					const columns = columnsData.values || [];
					if (columns.length === 0) {
						throw new Error(
							'At least one column must be specified for UPDATE.',
						);
					}
					if (!where.trim()) {
						throw new Error(
							'WHERE clause is required for UPDATE.',
						);
					}

					// Validate column names
					for (const col of columns) {
						validateIdentifier(col.column, 'column name');
					}

					const setClauses = columns
						.map((col) => `${col.column} = ${col.value}`)
						.join(', ');
					const database = options.database || credentials.database;
					const query = `ALTER TABLE ${table} UPDATE ${setClauses} WHERE ${where}`;

					const urlParams = buildUrlParams(database, options.querySettings);

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
							operation: 'update',
							table,
							columnsUpdated: columns.map((c) => c.column),
							where,
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

			// ── List Databases ─────────────────────────────────────────────
		} else if (operation === 'listDatabases') {
			try {
				const options = this.getNodeParameter('options', 0, {}) as {
					pattern?: string;
				};

				let query = 'SELECT name, engine, comment FROM system.databases';
				if (options.pattern) {
					query += ` WHERE name LIKE '${options.pattern.replace(/'/g, "\\'")}'`;
				}
				query += ' ORDER BY name FORMAT JSONEachRow';

				const urlParams = buildUrlParams(credentials.database);

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
						pairedItem: { item: 0 },
					});
				}
			} catch (error) {
				const chError = extractClickHouseError(error);
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: chError },
						pairedItem: { item: 0 },
					});
				} else {
					throw new NodeOperationError(this.getNode(), chError, { itemIndex: 0 });
				}
			}

			// ── List Tables ────────────────────────────────────────────────
		} else if (operation === 'listTables') {
			try {
				const options = this.getNodeParameter('options', 0, {}) as {
					database?: string;
					pattern?: string;
				};

				const database = options.database || credentials.database;
				const conditions = [`database = '${database.replace(/'/g, "\\'")}'`];

				if (options.pattern) {
					conditions.push(
						`name LIKE '${options.pattern.replace(/'/g, "\\'")}'`,
					);
				}

				const query = `SELECT name, engine, total_rows, total_bytes, partition_key, sorting_key, comment FROM system.tables WHERE ${conditions.join(' AND ')} ORDER BY name FORMAT JSONEachRow`;
				const urlParams = buildUrlParams(credentials.database);

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
						pairedItem: { item: 0 },
					});
				}
			} catch (error) {
				const chError = extractClickHouseError(error);
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: chError },
						pairedItem: { item: 0 },
					});
				} else {
					throw new NodeOperationError(this.getNode(), chError, { itemIndex: 0 });
				}
			}

			// ── Get Table Info ──────────────────────────────────────────────
		} else if (operation === 'getTableInfo') {
			try {
				const table = this.getNodeParameter('table', 0) as string;
				const options = this.getNodeParameter('options', 0, {}) as {
					database?: string;
					includeColumns?: boolean;
				};

				validateIdentifier(table, 'table name');
				const database = options.database || credentials.database;
				const includeColumns = options.includeColumns !== false;
				const urlParams = buildUrlParams(credentials.database);

				// Get table metadata
				const tableQuery = `SELECT name, engine, total_rows, total_bytes, partition_key, sorting_key, primary_key, create_table_query, comment FROM system.tables WHERE database = '${database.replace(/'/g, "\\'")}' AND name = '${table.replace(/'/g, "\\'")}' FORMAT JSONEachRow`;

				const tableResponse = (await this.helpers.httpRequest({
					method: 'POST',
					url: `${baseUrl}/?${urlParams}`,
					headers: {
						Authorization: authHeader,
						'Content-Type': 'text/plain',
					},
					body: tableQuery,
					returnFullResponse: false,
				})) as string;

				const tableRows = parseClickHouseResponse(tableResponse);
				if (tableRows.length === 0) {
					throw new Error(`Table "${table}" not found in database "${database}".`);
				}

				const tableInfo = tableRows[0] as IDataObject;

				if (includeColumns) {
					const colQuery = `SELECT name, type, default_kind, default_expression, comment, is_in_partition_key, is_in_sorting_key, is_in_primary_key FROM system.columns WHERE database = '${database.replace(/'/g, "\\'")}' AND table = '${table.replace(/'/g, "\\'")}' ORDER BY position FORMAT JSONEachRow`;

					const colResponse = (await this.helpers.httpRequest({
						method: 'POST',
						url: `${baseUrl}/?${urlParams}`,
						headers: {
							Authorization: authHeader,
							'Content-Type': 'text/plain',
						},
						body: colQuery,
						returnFullResponse: false,
					})) as string;

					tableInfo.columns = parseClickHouseResponse(colResponse) as unknown as IDataObject[];
				}

				returnData.push({
					json: tableInfo,
					pairedItem: { item: 0 },
				});
			} catch (error) {
				const chError = extractClickHouseError(error);
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: chError },
						pairedItem: { item: 0 },
					});
				} else {
					throw new NodeOperationError(this.getNode(), chError, { itemIndex: 0 });
				}
			}

			// ── Create Table ────────────────────────────────────────────────
		} else if (operation === 'createTable') {
			try {
				const table = this.getNodeParameter('table', 0) as string;
				const engine = this.getNodeParameter('engine', 0) as string;
				const inferSchema = this.getNodeParameter('inferSchema', 0) as boolean;
				const options = this.getNodeParameter('options', 0, {}) as {
					database?: string;
					ifNotExists?: boolean;
					partitionBy?: string;
					ttl?: string;
				};

				const database = options.database || credentials.database;
				let columns: Array<{ name: string; type: string }>;

				if (inferSchema) {
					// Infer schema from the first input item
					if (items.length === 0 || !items[0].json || Object.keys(items[0].json).length === 0) {
						throw new Error(
							'No input items available to infer schema from. Either pass input data or disable "Create from Input Items" and define columns manually.',
						);
					}
					columns = Object.entries(items[0].json).map(([name, value]) => ({
						name,
						type: inferClickHouseType(value),
					}));
				} else {
					const columnsData = this.getNodeParameter('columns', 0, {}) as {
						values?: Array<{ name: string; type: string }>;
					};
					columns = columnsData.values || [];
					if (columns.length === 0) {
						throw new Error(
							'At least one column must be defined.',
						);
					}
				}

				// For MergeTree family, orderBy is required
				let orderBy = '';
				const mergeTreeEngines = [
					'MergeTree',
					'ReplacingMergeTree',
					'SummingMergeTree',
					'AggregatingMergeTree',
					'CollapsingMergeTree',
				];
				if (mergeTreeEngines.includes(engine)) {
					orderBy = this.getNodeParameter('orderBy', 0) as string;
					if (!orderBy.trim()) {
						throw new Error(
							`ORDER BY is required for ${engine} engine.`,
						);
					}
				}

				const ddl = buildCreateTableDDL({
					table,
					database,
					columns,
					engine,
					orderBy,
					ifNotExists: options.ifNotExists !== false,
					partitionBy: options.partitionBy,
					ttl: options.ttl,
				});

				const urlParams = buildUrlParams(database);

				const response = (await this.helpers.httpRequest({
					method: 'POST',
					url: `${baseUrl}/?${urlParams}`,
					headers: {
						Authorization: authHeader,
						'Content-Type': 'text/plain',
					},
					body: ddl,
					returnFullResponse: false,
				})) as string;

				returnData.push({
					json: {
						success: true,
						operation: 'createTable',
						table,
						database,
						engine,
						columns,
						ddl,
						response: response || 'OK',
					},
					pairedItem: { item: 0 },
				});
			} catch (error) {
				const chError = extractClickHouseError(error);
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: chError },
						pairedItem: { item: 0 },
					});
				} else {
					throw new NodeOperationError(this.getNode(), chError, { itemIndex: 0 });
				}
			}

			// ── Execute Raw ────────────────────────────────────────────────
		} else if (operation === 'executeRaw') {
			for (let i = 0; i < items.length; i++) {
				try {
					const query = this.getNodeParameter('query', i) as string;
					const options = this.getNodeParameter('options', i, {}) as {
						querySettings?: string;
					};

					const urlParams = buildUrlParams(
						credentials.database,
						options.querySettings,
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
