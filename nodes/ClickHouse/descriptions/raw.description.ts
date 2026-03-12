import type { INodeProperties } from 'n8n-workflow';

export const rawFields: INodeProperties[] = [
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'CREATE TABLE IF NOT EXISTS my_table (id UInt64, name String) ENGINE = MergeTree() ORDER BY id',
		description: 'The DDL or DML statement to execute (CREATE, ALTER, DROP, TRUNCATE, OPTIMIZE, etc.)',
		typeOptions: {
			rows: 5,
			alwaysOpenEditWindow: true,
		},
		displayOptions: {
			show: {
				operation: ['executeRaw'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				operation: ['executeRaw'],
			},
		},
		options: [
			{
				displayName: 'Query Settings',
				name: 'querySettings',
				type: 'string',
				default: '',
				placeholder: '{"max_execution_time": 60}',
				description:
					'JSON string of ClickHouse settings to pass as URL parameters',
			},
		],
	},
];
