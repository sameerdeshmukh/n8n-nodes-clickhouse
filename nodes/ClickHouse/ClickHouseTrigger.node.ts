import type {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	buildBaseUrl,
	buildAuthHeader,
	buildUrlParams,
	parseClickHouseResponse,
	extractClickHouseError,
} from './ClickHouse.helpers';
import type { ClickHouseCredentials } from './ClickHouse.helpers';

export class ClickHouseTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ClickHouse Trigger',
		name: 'clickHouseTrigger',
		icon: 'file:clickhouse.svg',
		group: ['trigger'],
		version: 1,
		subtitle: 'Polls ClickHouse for new or changed rows',
		description:
			'Triggers a workflow when new rows appear or data changes in a ClickHouse table',
		defaults: {
			name: 'ClickHouse Trigger',
		},
		polling: true,
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'clickHouseApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'New Rows',
						value: 'newRows',
						description:
							'Trigger when new rows are detected, tracked by a monotonically increasing column',
					},
					{
						name: 'Custom Query',
						value: 'customQuery',
						description:
							'Trigger when a custom SELECT query returns new results',
					},
				],
				default: 'newRows',
			},
			// ── New Rows mode ──────────────────────────────────────────
			{
				displayName: 'Table',
				name: 'table',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'events',
				description: 'The table to poll for new rows',
				displayOptions: {
					show: {
						mode: ['newRows'],
					},
				},
			},
			{
				displayName: 'Tracking Column',
				name: 'trackingColumn',
				type: 'string',
				required: true,
				default: 'id',
				placeholder: 'id',
				description:
					'A monotonically increasing column (e.g. auto-increment ID, DateTime). The trigger will fetch rows where this column is greater than the last seen value.',
			},
			{
				displayName: 'Columns to Return',
				name: 'selectColumns',
				type: 'string',
				default: '*',
				placeholder: 'id, name, created_at',
				description: 'Comma-separated list of columns to return, or * for all',
				displayOptions: {
					show: {
						mode: ['newRows'],
					},
				},
			},
			// ── Custom Query mode ──────────────────────────────────────
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				placeholder:
					"SELECT * FROM events WHERE created_at > '{lastValue}' ORDER BY created_at",
				description:
					'Custom SELECT query. Use {lastValue} as a placeholder for the last tracked value.',
				typeOptions: {
					rows: 5,
					alwaysOpenEditWindow: true,
				},
				displayOptions: {
					show: {
						mode: ['customQuery'],
					},
				},
			},
			// ── Common options ─────────────────────────────────────────
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Database',
						name: 'database',
						type: 'string',
						default: '',
						placeholder: 'my_database',
						description: 'Override the database from credentials',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 1000,
						description: 'Maximum number of rows to return per poll',
						typeOptions: {
							minValue: 1,
						},
					},
					{
						displayName: 'Initial Tracking Value',
						name: 'initialValue',
						type: 'string',
						default: '0',
						description:
							'The starting value for the tracking column on first run. Use "0" for numeric IDs or a date string for DateTime columns.',
					},
				],
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const credentials =
			(await this.getCredentials('clickHouseApi')) as unknown as ClickHouseCredentials;
		const baseUrl = buildBaseUrl(credentials);
		const authHeader = buildAuthHeader(credentials);

		const mode = this.getNodeParameter('mode') as string;
		const trackingColumn = this.getNodeParameter('trackingColumn') as string;
		const options = this.getNodeParameter('options', {}) as {
			database?: string;
			limit?: number;
			initialValue?: string;
		};

		const database = options.database || credentials.database;
		const limit = Math.max(1, Math.floor(options.limit ?? 1000));

		// Get last tracked value from workflow static data
		const staticData = this.getWorkflowStaticData('node');
		let lastValue = (staticData.lastValue as string) || options.initialValue || '0';

		let query: string;

		if (mode === 'newRows') {
			const table = this.getNodeParameter('table') as string;
			const selectColumns = this.getNodeParameter('selectColumns') as string;

			query = `SELECT ${selectColumns || '*'} FROM ${table} WHERE ${trackingColumn} > '${lastValue.replace(/'/g, "\\'")}' ORDER BY ${trackingColumn} ASC LIMIT ${limit} FORMAT JSONEachRow`;
		} else {
			// customQuery mode
			const rawQuery = this.getNodeParameter('query') as string;
			query = rawQuery.replace(/\{lastValue\}/g, lastValue.replace(/'/g, "\\'"));

			// Ensure FORMAT is appended
			if (!/\bFORMAT\b/i.test(query)) {
				query = `${query.replace(/;\s*$/, '')} FORMAT JSONEachRow`;
			}
		}

		try {
			const urlParams = buildUrlParams(database);

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

			if (rows.length === 0) {
				return null;
			}

			// Update the tracking value to the last row's tracking column
			const lastRow = rows[rows.length - 1];
			if (lastRow && trackingColumn in lastRow) {
				staticData.lastValue = String(lastRow[trackingColumn]);
			}

			const returnData: INodeExecutionData[] = rows.map((row) => ({
				json: row as IDataObject,
			}));

			return [returnData];
		} catch (error) {
			const chError = extractClickHouseError(error);
			throw new NodeOperationError(this.getNode(), chError);
		}
	}
}
