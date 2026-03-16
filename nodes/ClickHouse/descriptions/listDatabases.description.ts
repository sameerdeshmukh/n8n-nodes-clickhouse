import type { INodeProperties } from 'n8n-workflow';

export const listDatabasesFields: INodeProperties[] = [
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				operation: ['listDatabases'],
			},
		},
		options: [
			{
				displayName: 'Pattern',
				name: 'pattern',
				type: 'string',
				default: '',
				placeholder: '%analytics%',
				description: 'Filter database names using a SQL LIKE pattern',
			},
		],
	},
];
