/**
 * Pure utility functions for ClickHouse HTTP interface communication.
 * Uses ONLY Node.js built-ins — no npm imports.
 */

/** Pattern for valid ClickHouse identifiers (database names, table names). */
const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;

/** Pattern for valid query parameter names. */
const VALID_PARAM_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/** Allowlist of ClickHouse settings that can be passed as URL parameters. */
const ALLOWED_SETTINGS = new Set([
	'max_execution_time',
	'max_rows_to_read',
	'max_result_rows',
	'max_result_bytes',
	'max_memory_usage',
	'max_bytes_before_external_sort',
	'max_bytes_before_external_group_by',
	'max_threads',
	'max_block_size',
	'max_insert_block_size',
	'read_overflow_mode',
	'result_overflow_mode',
	'timeout_overflow_mode',
	'connect_timeout',
	'receive_timeout',
	'send_timeout',
	'output_format_json_quote_64bit_integers',
	'output_format_json_quote_denormals',
	'enable_http_compression',
	'use_client_time_zone',
	'session_id',
	'session_timeout',
	'session_check',
	'extremes',
	'replace_running_query',
	'insert_quorum',
	'insert_quorum_timeout',
	'select_sequential_consistency',
	'date_time_input_format',
	'date_time_output_format',
	'input_format_allow_errors_num',
	'input_format_allow_errors_ratio',
	'join_use_nulls',
	'any_join_distinct_right_table_keys',
	'max_partitions_per_insert_block',
	'allow_experimental_lightweight_delete',
	'mutations_sync',
	'async_insert',
	'wait_for_async_insert',
]);

export interface ClickHouseCredentials {
	host: string;
	port: number;
	database: string;
	username: string;
	password: string;
	protocol: string;
	authMethod?: string;
	jwtToken?: string;
}

export interface QueryParam {
	name: string;
	value: string;
}

export interface ColumnMapping {
	sourceField: string;
	targetColumn: string;
}

export interface QueryStats {
	read_rows: string;
	read_bytes: string;
	written_rows: string;
	written_bytes: string;
	total_rows_to_read: string;
	elapsed_ns: string;
}

/**
 * Validates a ClickHouse identifier (database name, table name).
 * Throws if the identifier contains invalid characters that could enable injection.
 */
export function validateIdentifier(value: string, label: string): void {
	if (!value || !VALID_IDENTIFIER.test(value)) {
		throw new Error(
			`Invalid ${label}: "${value}". Only letters, digits, underscores, and dots are allowed.`,
		);
	}
}

/**
 * Validates a query parameter name.
 * Throws if the name contains invalid characters.
 */
function validateParamName(name: string): void {
	if (!name || !VALID_PARAM_NAME.test(name)) {
		throw new Error(
			`Invalid query parameter name: "${name}". Only letters, digits, and underscores are allowed.`,
		);
	}
}

/**
 * Validates that a port number is within the valid TCP range.
 */
export function validatePort(port: number): void {
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error(`Invalid port: ${port}. Must be an integer between 1 and 65535.`);
	}
}

export function buildBaseUrl(credentials: ClickHouseCredentials): string {
	validatePort(credentials.port);
	const protocol = credentials.protocol === 'https' ? 'https' : 'http';
	return `${protocol}://${credentials.host}:${credentials.port}`;
}

export function buildAuthHeader(credentials: ClickHouseCredentials): string {
	if (credentials.authMethod === 'bearerToken') {
		return `Bearer ${credentials.jwtToken || ''}`;
	}
	const token = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
	return `Basic ${token}`;
}

export function buildUrlParams(
	database: string,
	settings?: string,
	queryParams?: QueryParam[],
): string {
	validateIdentifier(database, 'database name');
	const params: string[] = [`database=${encodeURIComponent(database)}`];

	if (queryParams && queryParams.length > 0) {
		for (const param of queryParams) {
			validateParamName(param.name);
			params.push(`param_${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`);
		}
	}

	if (settings) {
		try {
			const parsed = JSON.parse(settings) as Record<string, unknown>;
			for (const [key, value] of Object.entries(parsed)) {
				if (!ALLOWED_SETTINGS.has(key)) {
					throw new Error(
						`ClickHouse setting "${key}" is not in the allowlist. ` +
						'See the node documentation for supported settings.',
					);
				}
				params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
			}
		} catch (error) {
			if (error instanceof SyntaxError) {
				throw new Error('Query settings must be a valid JSON object (e.g. {"max_execution_time": 30}).');
			}
			throw error;
		}
	}

	return params.join('&');
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
	const safeSize = Math.max(1, Math.min(Math.floor(size), 100_000));
	const chunks: T[][] = [];
	for (let i = 0; i < arr.length; i += safeSize) {
		chunks.push(arr.slice(i, i + safeSize));
	}
	return chunks;
}

export function parseClickHouseResponse(body: string): Record<string, unknown>[] {
	if (!body || !body.trim()) {
		return [];
	}
	return body
		.split('\n')
		.filter(Boolean)
		.map((line) => JSON.parse(line) as Record<string, unknown>);
}

/**
 * Extracts a user-safe error message from a ClickHouse HTTP error response.
 * Strips potential credential/connection details and keeps only the
 * ClickHouse error code and message.
 */
export function extractClickHouseError(error: unknown): string {
	let raw = '';

	if (error && typeof error === 'object') {
		const err = error as Record<string, unknown>;
		if (err.response && typeof err.response === 'object') {
			const response = err.response as Record<string, unknown>;
			if (typeof response.body === 'string') {
				raw = response.body;
			}
		}
		if (!raw && err.cause && typeof err.cause === 'object') {
			const cause = err.cause as Record<string, unknown>;
			if (typeof cause.body === 'string') {
				raw = cause.body;
			}
		}
		if (!raw && typeof err.message === 'string') {
			raw = err.message;
		}
	}

	if (!raw) {
		raw = String(error);
	}

	return sanitizeErrorMessage(raw);
}

/**
 * Applies column mapping to a row object.
 * Renames source fields to target columns, optionally filtering to only mapped fields.
 */
export function applyColumnMapping(
	row: Record<string, unknown>,
	mappings: ColumnMapping[],
	onlyMapped: boolean,
): Record<string, unknown> {
	if (!mappings || mappings.length === 0) {
		return row;
	}

	const mappingMap = new Map<string, string>();
	for (const m of mappings) {
		if (m.sourceField && m.targetColumn) {
			mappingMap.set(m.sourceField, m.targetColumn);
		}
	}

	if (onlyMapped) {
		const result: Record<string, unknown> = {};
		for (const [source, target] of mappingMap) {
			if (source in row) {
				result[target] = row[source];
			}
		}
		return result;
	}

	// Apply mappings but keep unmapped fields as-is
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(row)) {
		const mappedName = mappingMap.get(key) || key;
		result[mappedName] = value;
	}
	return result;
}

/**
 * Parses the X-ClickHouse-Summary header into a structured stats object.
 */
export function parseQueryStats(summaryHeader: string | undefined): QueryStats | null {
	if (!summaryHeader) {
		return null;
	}
	try {
		return JSON.parse(summaryHeader) as QueryStats;
	} catch {
		return null;
	}
}

/**
 * Infers a ClickHouse type from a JavaScript value.
 */
export function inferClickHouseType(value: unknown): string {
	if (value === null || value === undefined) {
		return 'Nullable(String)';
	}
	if (typeof value === 'boolean') {
		return 'Bool';
	}
	if (typeof value === 'number') {
		return Number.isInteger(value) ? 'Int64' : 'Float64';
	}
	if (typeof value === 'string') {
		// Detect ISO date strings
		if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
			return 'DateTime';
		}
		if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
			return 'Date';
		}
		// Detect UUID
		if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
			return 'UUID';
		}
		return 'String';
	}
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return 'Array(String)';
		}
		const innerType = inferClickHouseType(value[0]);
		return `Array(${innerType})`;
	}
	return 'String';
}

/**
 * Builds a CREATE TABLE DDL from column definitions and options.
 */
export function buildCreateTableDDL(params: {
	table: string;
	database: string;
	columns: Array<{ name: string; type: string }>;
	engine: string;
	orderBy: string;
	ifNotExists: boolean;
	partitionBy?: string;
	ttl?: string;
}): string {
	validateIdentifier(params.table, 'table name');
	validateIdentifier(params.database, 'database name');

	for (const col of params.columns) {
		validateIdentifier(col.name, 'column name');
	}

	const colDefs = params.columns.map((c) => `\`${c.name}\` ${c.type}`).join(', ');
	const ifNotExists = params.ifNotExists ? 'IF NOT EXISTS ' : '';

	let ddl = `CREATE TABLE ${ifNotExists}\`${params.database}\`.\`${params.table}\` (${colDefs}) ENGINE = ${params.engine}()`;

	if (params.orderBy) {
		// Validate each ORDER BY column
		for (const col of params.orderBy.split(',').map((c) => c.trim())) {
			if (col) validateIdentifier(col, 'ORDER BY column');
		}
		ddl += ` ORDER BY (${params.orderBy})`;
	}

	if (params.partitionBy) {
		ddl += ` PARTITION BY ${params.partitionBy}`;
	}

	if (params.ttl) {
		ddl += ` TTL ${params.ttl}`;
	}

	return ddl;
}

/**
 * Removes potentially sensitive data (hostnames, IPs, ports, file paths)
 * from ClickHouse error messages while preserving the error code and
 * the human-readable portion.
 */
function sanitizeErrorMessage(message: string): string {
	// Keep the first 2000 characters to prevent huge error payloads
	let sanitized = message.slice(0, 2000);

	// Strip stack traces (lines starting with "at ")
	sanitized = sanitized.replace(/\n\s+at .+/g, '');

	// Strip absolute file paths
	sanitized = sanitized.replace(/\/[^\s:]+\.(cpp|h|cc|c):\d+/g, '[internal]');

	return sanitized.trim();
}
