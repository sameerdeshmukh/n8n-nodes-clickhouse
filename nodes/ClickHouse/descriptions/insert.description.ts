import type { INodeProperties } from 'n8n-workflow';

export const insertFields: INodeProperties[] = [
	{
		displayName: 'Table',
		name: 'table',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'my_table',
		description: 'The name of the table to insert data into',
		displayOptions: {
			show: {
				operation: ['insert'],
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
				operation: ['insert'],
			},
		},
		options: [
			{
				displayName: 'Chunk Size',
				name: 'chunkSize',
				type: 'number',
				default: 1000,
				description: 'Number of rows to insert per HTTP request',
				typeOptions: {
					minValue: 1,
				},
			},
			{
				displayName: 'Database',
				name: 'database',
				type: 'string',
				default: '',
				placeholder: 'my_database',
				description: 'Override the database from credentials for this insert',
			},
		],
	},
];
