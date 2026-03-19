import type { INodeProperties } from 'n8n-workflow';

export const upsertFields: INodeProperties[] = [
	{
		displayName: 'Table Name or ID',
		name: 'table',
		type: 'options',
		required: true,
		default: '',
		placeholder: 'my_table',
		description:
			'The table to upsert data into. For ReplacingMergeTree tables, deduplication happens automatically. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getTables',
		},
		displayOptions: {
			show: {
				operation: ['upsert'],
			},
		},
	},
	{
		displayName: 'Key Columns',
		name: 'keyColumns',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'id, user_id',
		description:
			'Comma-separated list of columns that form the unique key for upsert. For ReplacingMergeTree, these should match the ORDER BY columns.',
		displayOptions: {
			show: {
				operation: ['upsert'],
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
				operation: ['upsert'],
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
				displayName: 'Column Mapping',
				name: 'columnMapping',
				type: 'fixedCollection',
				default: {},
				placeholder: 'Add Mapping',
				description:
					'Map n8n field names to ClickHouse column names. If empty, fields are inserted as-is.',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'mappings',
						displayName: 'Mapping',
						values: [
							{
								displayName: 'Source Field',
								name: 'sourceField',
								type: 'string',
								default: '',
								placeholder: 'userName',
								description: 'The field name from the input item',
							},
							{
								displayName: 'Target Column',
								name: 'targetColumn',
								type: 'string',
								default: '',
								placeholder: 'user_name',
								description: 'The ClickHouse column name to map to',
							},
						],
					},
				],
			},
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
				displayName: 'Force Insert Mode',
				name: 'forceInsert',
				type: 'boolean',
				default: false,
				description:
					'Whether to skip engine detection and always use INSERT (for ReplacingMergeTree or when you want to rely on engine-level deduplication)',
			},
			{
				displayName: 'Only Mapped Columns',
				name: 'onlyMapped',
				type: 'boolean',
				default: false,
				description:
					'Whether to only include columns that are explicitly mapped (ignore unmapped fields)',
			},
			{
				displayName: 'Version Column',
				name: 'versionColumn',
				type: 'string',
				default: '',
				placeholder: 'updated_at',
				description:
					'For ReplacingMergeTree: the column used to determine which row version to keep. Leave empty to use the last inserted row.',
			},
		],
	},
];
