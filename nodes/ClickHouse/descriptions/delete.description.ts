import type { INodeProperties } from 'n8n-workflow';

export const deleteFields: INodeProperties[] = [
	{
		displayName: 'Table Name or ID',
		name: 'table',
		type: 'options',
		required: true,
		default: '',
		placeholder: 'my_table',
		description:
			'The table to delete rows from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getTables',
		},
		displayOptions: {
			show: {
				operation: ['deleteRows'],
			},
		},
	},
	{
		displayName: 'Where Clause',
		name: 'where',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'id = 42 AND status = \'inactive\'',
		description:
			'The WHERE condition for the DELETE. Rows matching this condition will be deleted. Do NOT include the WHERE keyword.',
		typeOptions: {
			rows: 3,
		},
		displayOptions: {
			show: {
				operation: ['deleteRows'],
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
				operation: ['deleteRows'],
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
