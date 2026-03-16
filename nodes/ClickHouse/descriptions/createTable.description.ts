import type { INodeProperties } from 'n8n-workflow';

export const createTableFields: INodeProperties[] = [
	{
		displayName: 'Table Name',
		name: 'table',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'my_new_table',
		description: 'The name of the table to create',
		displayOptions: {
			show: {
				operation: ['createTable'],
			},
		},
	},
	{
		displayName: 'Engine',
		name: 'engine',
		type: 'options',
		required: true,
		default: 'MergeTree',
		description: 'The ClickHouse table engine',
		displayOptions: {
			show: {
				operation: ['createTable'],
			},
		},
		options: [
			{
				name: 'MergeTree',
				value: 'MergeTree',
				description: 'Default engine for most use cases',
			},
			{
				name: 'ReplacingMergeTree',
				value: 'ReplacingMergeTree',
				description: 'Deduplicates rows by sorting key on merge',
			},
			{
				name: 'SummingMergeTree',
				value: 'SummingMergeTree',
				description: 'Automatically sums numeric columns on merge',
			},
			{
				name: 'AggregatingMergeTree',
				value: 'AggregatingMergeTree',
				description: 'Stores pre-aggregated data with aggregate functions',
			},
			{
				name: 'CollapsingMergeTree',
				value: 'CollapsingMergeTree',
				description: 'Collapses rows with sign column on merge',
			},
			{
				name: 'Log',
				value: 'Log',
				description: 'Lightweight engine for small tables / temporary data',
			},
			{
				name: 'Memory',
				value: 'Memory',
				description: 'In-memory storage, data lost on restart',
			},
		],
	},
	{
		displayName: 'Create from Input Items',
		name: 'inferSchema',
		type: 'boolean',
		default: true,
		description:
			'Whether to infer column names and types from the input items. When disabled, you must specify columns manually.',
		displayOptions: {
			show: {
				operation: ['createTable'],
			},
		},
	},
	{
		displayName: 'Columns',
		name: 'columns',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Column',
		description: 'Define the columns manually',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				operation: ['createTable'],
				inferSchema: [false],
			},
		},
		options: [
			{
				name: 'values',
				displayName: 'Column',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						placeholder: 'id',
						description: 'Column name',
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						default: 'String',
						options: [
							{ name: 'String', value: 'String' },
							{ name: 'UInt8', value: 'UInt8' },
							{ name: 'UInt16', value: 'UInt16' },
							{ name: 'UInt32', value: 'UInt32' },
							{ name: 'UInt64', value: 'UInt64' },
							{ name: 'Int8', value: 'Int8' },
							{ name: 'Int16', value: 'Int16' },
							{ name: 'Int32', value: 'Int32' },
							{ name: 'Int64', value: 'Int64' },
							{ name: 'Float32', value: 'Float32' },
							{ name: 'Float64', value: 'Float64' },
							{ name: 'DateTime', value: 'DateTime' },
							{ name: 'Date', value: 'Date' },
							{ name: 'Bool', value: 'Bool' },
							{ name: 'UUID', value: 'UUID' },
							{ name: 'Array(String)', value: 'Array(String)' },
							{ name: 'Nullable(String)', value: 'Nullable(String)' },
						],
						description: 'ClickHouse data type',
					},
				],
			},
		],
	},
	{
		displayName: 'Order By',
		name: 'orderBy',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'id',
		description:
			'Comma-separated list of columns for ORDER BY (required for MergeTree family engines)',
		displayOptions: {
			show: {
				operation: ['createTable'],
				engine: [
					'MergeTree',
					'ReplacingMergeTree',
					'SummingMergeTree',
					'AggregatingMergeTree',
					'CollapsingMergeTree',
				],
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
				operation: ['createTable'],
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
				displayName: 'If Not Exists',
				name: 'ifNotExists',
				type: 'boolean',
				default: true,
				description: 'Whether to add IF NOT EXISTS clause',
			},
			{
				displayName: 'Partition By',
				name: 'partitionBy',
				type: 'string',
				default: '',
				placeholder: 'toYYYYMM(created_at)',
				description: 'Expression for the PARTITION BY clause',
			},
			{
				displayName: 'TTL',
				name: 'ttl',
				type: 'string',
				default: '',
				placeholder: 'created_at + INTERVAL 90 DAY',
				description: 'TTL expression for automatic data expiration',
			},
		],
	},
];
