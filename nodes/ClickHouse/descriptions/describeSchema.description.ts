import type { INodeProperties } from 'n8n-workflow';

export const describeSchemaFields: INodeProperties[] = [
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				operation: ['describeSchema'],
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
				displayName: 'Include Sample Values',
				name: 'includeSamples',
				type: 'boolean',
				default: false,
				description:
					'Whether to include sample values per table to help AI agents understand the data',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				default: 'both',
				options: [
					{
						name: 'Both',
						value: 'both',
						description:
							'Returns both structured JSON and a concise text summary for AI agents',
					},
					{
						name: 'Structured JSON',
						value: 'structured',
						description: 'Full JSON with tables, columns, and metadata',
					},
					{
						name: 'Text Summary',
						value: 'summary',
						description:
							'Concise text description optimized for AI agent context windows',
					},
				],
				description: 'How to format the schema output',
			},
			{
				displayName: 'Sample Size',
				name: 'sampleSize',
				type: 'number',
				default: 3,
				description: 'Number of sample rows to fetch per table when Include Sample Values is enabled',
				typeOptions: {
					minValue: 1,
					maxValue: 10,
				},
			},
			{
				displayName: 'Table Pattern',
				name: 'tablePattern',
				type: 'string',
				default: '',
				placeholder: '%events%',
				description: 'Filter table names using a SQL LIKE pattern',
			},
		],
	},
];
