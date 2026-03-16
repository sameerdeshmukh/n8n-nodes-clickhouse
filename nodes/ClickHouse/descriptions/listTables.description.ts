import type { INodeProperties } from 'n8n-workflow';

export const listTablesFields: INodeProperties[] = [
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				operation: ['listTables'],
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
					'List tables from a specific database. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				typeOptions: {
					loadOptionsMethod: 'getDatabases',
				},
			},
			{
				displayName: 'Pattern',
				name: 'pattern',
				type: 'string',
				default: '',
				placeholder: '%events%',
				description: 'Filter table names using a SQL LIKE pattern',
			},
		],
	},
];
