import type { INodeProperties } from 'n8n-workflow';

export const updateFields: INodeProperties[] = [
	{
		displayName: 'Table Name or ID',
		name: 'table',
		type: 'options',
		required: true,
		default: '',
		placeholder: 'my_table',
		description:
			'The table to update rows in. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getTables',
		},
		displayOptions: {
			show: {
				operation: ['updateRows'],
			},
		},
	},
	{
		displayName: 'Columns to Update',
		name: 'columns',
		type: 'fixedCollection',
		required: true,
		default: {},
		placeholder: 'Add Column',
		description: 'Column-value pairs to set in the matching rows',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				operation: ['updateRows'],
			},
		},
		options: [
			{
				name: 'values',
				displayName: 'Column',
				values: [
					{
						displayName: 'Column Name',
						name: 'column',
						type: 'string',
						default: '',
						placeholder: 'status',
						description: 'The column name to update',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: "'active'",
						description:
							'The new value (use ClickHouse SQL syntax — wrap strings in single quotes)',
					},
				],
			},
		],
	},
	{
		displayName: 'Where Clause',
		name: 'where',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'id = 42',
		description:
			'The WHERE condition for the UPDATE. Rows matching this condition will be updated. Do NOT include the WHERE keyword.',
		typeOptions: {
			rows: 3,
		},
		displayOptions: {
			show: {
				operation: ['updateRows'],
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
				operation: ['updateRows'],
			},
		},
		options: [
			{
				displayName: 'Database Name or ID',
				name: 'database',
				type: 'options',
				default: '',
				placeholder: 'my_database',
				description:
					'Override the database from credentials. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				typeOptions: {
					loadOptionsMethod: 'getDatabases',
				},
			},
			{
				displayName: 'Query Settings',
				name: 'querySettings',
				type: 'string',
				default: '',
				placeholder: '{"mutations_sync": 1}',
				description:
					'JSON string of ClickHouse settings. Use {"mutations_sync": 1} to wait for completion.',
			},
		],
	},
];
