import type { INodeProperties } from 'n8n-workflow';

export const getTableInfoFields: INodeProperties[] = [
	{
		displayName: 'Table Name or ID',
		name: 'table',
		type: 'options',
		required: true,
		default: '',
		placeholder: 'my_table',
		description:
			'The table to get info for. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getTables',
		},
		displayOptions: {
			show: {
				operation: ['getTableInfo'],
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
				operation: ['getTableInfo'],
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
				displayName: 'Include Columns',
				name: 'includeColumns',
				type: 'boolean',
				default: true,
				description: 'Whether to include column schema information',
			},
		],
	},
];
