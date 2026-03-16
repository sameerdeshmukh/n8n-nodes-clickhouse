import type { INodeProperties } from 'n8n-workflow';

export const queryFields: INodeProperties[] = [
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'SELECT * FROM my_table WHERE id = {id:UInt64}',
		description: 'The SELECT SQL query to execute. Use {name:Type} syntax for parameterized queries.',
		typeOptions: {
			rows: 5,
			alwaysOpenEditWindow: true,
		},
		displayOptions: {
			show: {
				operation: ['executeQuery'],
			},
		},
	},
	{
		displayName: 'Query Parameters',
		name: 'queryParameters',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Parameter',
		description:
			'Parameters for the query. Use {name:Type} placeholders in SQL and define values here.',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				operation: ['executeQuery'],
			},
		},
		options: [
			{
				name: 'params',
				displayName: 'Parameter',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						placeholder: 'id',
						description: 'Parameter name (must match the {name:Type} placeholder in the query)',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: '42',
						description: 'Parameter value',
					},
				],
			},
		],
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				operation: ['executeQuery'],
			},
		},
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 100,
				description:
					'Maximum number of rows to return per page. Appended as LIMIT unless the query already contains one.',
				typeOptions: {
					minValue: 0,
				},
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				description:
					'Number of rows to skip (for pagination). Appended as OFFSET unless the query already contains one.',
				typeOptions: {
					minValue: 0,
				},
			},
			{
				displayName: 'Include Query Stats',
				name: 'includeStats',
				type: 'boolean',
				default: false,
				description:
					'Whether to include execution statistics (rows_read, bytes_read, elapsed) from X-ClickHouse-Summary header',
			},
			{
				displayName: 'Query ID',
				name: 'queryId',
				type: 'string',
				default: '',
				placeholder: 'my-query-001',
				description:
					'Optional query identifier for tracking and cancellation. Returned in the output.',
			},
			{
				displayName: 'Query Settings',
				name: 'querySettings',
				type: 'string',
				default: '',
				placeholder: '{"max_execution_time": 30}',
				description:
					'JSON string of ClickHouse settings to pass as URL parameters (e.g. max_execution_time, max_rows_to_read)',
			},
		],
	},
];
