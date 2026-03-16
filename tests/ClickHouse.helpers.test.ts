import {
	validateIdentifier,
	validatePort,
	buildBaseUrl,
	buildAuthHeader,
	buildUrlParams,
	chunkArray,
	parseClickHouseResponse,
	extractClickHouseError,
	applyColumnMapping,
	parseQueryStats,
	inferClickHouseType,
	buildCreateTableDDL,
} from '../nodes/ClickHouse/ClickHouse.helpers';
import type { ClickHouseCredentials } from '../nodes/ClickHouse/ClickHouse.helpers';

const creds: ClickHouseCredentials = {
	host: 'localhost',
	port: 8123,
	database: 'default',
	username: 'default',
	password: 'secret',
	protocol: 'http',
};

// ── validateIdentifier ──────────────────────────────────────────────

describe('validateIdentifier', () => {
	it('accepts valid identifiers', () => {
		expect(() => validateIdentifier('my_table', 'table')).not.toThrow();
		expect(() => validateIdentifier('db.table', 'table')).not.toThrow();
		expect(() => validateIdentifier('_private', 'table')).not.toThrow();
		expect(() => validateIdentifier('Table123', 'table')).not.toThrow();
	});

	it('rejects empty string', () => {
		expect(() => validateIdentifier('', 'table')).toThrow('Invalid table');
	});

	it('rejects identifiers starting with a digit', () => {
		expect(() => validateIdentifier('1table', 'table')).toThrow('Invalid table');
	});

	it('rejects identifiers with special characters', () => {
		expect(() => validateIdentifier('DROP TABLE; --', 'table')).toThrow('Invalid table');
		expect(() => validateIdentifier('my table', 'table')).toThrow('Invalid table');
	});
});

// ── validatePort ────────────────────────────────────────────────────

describe('validatePort', () => {
	it('accepts valid ports', () => {
		expect(() => validatePort(1)).not.toThrow();
		expect(() => validatePort(8123)).not.toThrow();
		expect(() => validatePort(65535)).not.toThrow();
	});

	it('rejects port 0', () => {
		expect(() => validatePort(0)).toThrow('Invalid port');
	});

	it('rejects negative ports', () => {
		expect(() => validatePort(-1)).toThrow('Invalid port');
	});

	it('rejects ports above 65535', () => {
		expect(() => validatePort(65536)).toThrow('Invalid port');
	});

	it('rejects non-integer ports', () => {
		expect(() => validatePort(3.14)).toThrow('Invalid port');
	});
});

// ── buildBaseUrl ────────────────────────────────────────────────────

describe('buildBaseUrl', () => {
	it('builds http URL', () => {
		expect(buildBaseUrl(creds)).toBe('http://localhost:8123');
	});

	it('builds https URL', () => {
		expect(buildBaseUrl({ ...creds, protocol: 'https', port: 8443 })).toBe(
			'https://localhost:8443',
		);
	});

	it('defaults to http for unknown protocol', () => {
		expect(buildBaseUrl({ ...creds, protocol: 'ftp' })).toBe('http://localhost:8123');
	});
});

// ── buildAuthHeader ─────────────────────────────────────────────────

describe('buildAuthHeader', () => {
	it('returns a Basic auth header by default', () => {
		const header = buildAuthHeader(creds);
		const decoded = Buffer.from(header.replace('Basic ', ''), 'base64').toString();
		expect(decoded).toBe('default:secret');
	});

	it('returns a Basic auth header when authMethod is basicAuth', () => {
		const header = buildAuthHeader({ ...creds, authMethod: 'basicAuth' });
		expect(header).toMatch(/^Basic /);
		const decoded = Buffer.from(header.replace('Basic ', ''), 'base64').toString();
		expect(decoded).toBe('default:secret');
	});

	it('returns a Bearer token when authMethod is bearerToken', () => {
		const header = buildAuthHeader({
			...creds,
			authMethod: 'bearerToken',
			jwtToken: 'my.jwt.token',
		});
		expect(header).toBe('Bearer my.jwt.token');
	});

	it('returns Bearer with empty string when jwtToken is missing', () => {
		const header = buildAuthHeader({
			...creds,
			authMethod: 'bearerToken',
		});
		expect(header).toBe('Bearer ');
	});
});

// ── buildUrlParams ──────────────────────────────────────────────────

describe('buildUrlParams', () => {
	it('includes database parameter', () => {
		const result = buildUrlParams('default');
		expect(result).toBe('database=default');
	});

	it('encodes special characters in database name', () => {
		// dots are valid identifiers
		const result = buildUrlParams('my.db');
		expect(result).toContain('database=my.db');
	});

	it('adds query parameters with param_ prefix', () => {
		const result = buildUrlParams('default', undefined, [
			{ name: 'user_id', value: '42' },
		]);
		expect(result).toContain('param_user_id=42');
	});

	it('rejects invalid parameter names', () => {
		expect(() =>
			buildUrlParams('default', undefined, [{ name: 'bad name', value: '1' }]),
		).toThrow('Invalid query parameter name');
	});

	it('parses and applies allowed settings', () => {
		const result = buildUrlParams('default', '{"max_execution_time": 30}');
		expect(result).toContain('max_execution_time=30');
	});

	it('rejects disallowed settings', () => {
		expect(() => buildUrlParams('default', '{"evil_setting": 1}')).toThrow(
			'not in the allowlist',
		);
	});

	it('rejects invalid JSON settings', () => {
		expect(() => buildUrlParams('default', 'not json')).toThrow('valid JSON object');
	});
});

// ── chunkArray ──────────────────────────────────────────────────────

describe('chunkArray', () => {
	it('splits array into chunks', () => {
		expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
	});

	it('returns single chunk when array is smaller than chunk size', () => {
		expect(chunkArray([1, 2], 10)).toEqual([[1, 2]]);
	});

	it('handles empty array', () => {
		expect(chunkArray([], 5)).toEqual([]);
	});

	it('clamps chunk size to at least 1', () => {
		expect(chunkArray([1, 2, 3], 0)).toEqual([[1], [2], [3]]);
		expect(chunkArray([1, 2, 3], -5)).toEqual([[1], [2], [3]]);
	});

	it('clamps chunk size to at most 100000', () => {
		const arr = [1, 2, 3];
		expect(chunkArray(arr, 999999)).toEqual([[1, 2, 3]]);
	});

	it('floors non-integer chunk size', () => {
		expect(chunkArray([1, 2, 3, 4], 2.9)).toEqual([[1, 2], [3, 4]]);
	});
});

// ── parseClickHouseResponse ─────────────────────────────────────────

describe('parseClickHouseResponse', () => {
	it('parses newline-delimited JSON', () => {
		const body = '{"id":1,"name":"a"}\n{"id":2,"name":"b"}\n';
		expect(parseClickHouseResponse(body)).toEqual([
			{ id: 1, name: 'a' },
			{ id: 2, name: 'b' },
		]);
	});

	it('returns empty array for empty string', () => {
		expect(parseClickHouseResponse('')).toEqual([]);
	});

	it('returns empty array for whitespace-only', () => {
		expect(parseClickHouseResponse('   \n  ')).toEqual([]);
	});

	it('handles single row without trailing newline', () => {
		expect(parseClickHouseResponse('{"x":1}')).toEqual([{ x: 1 }]);
	});
});

// ── extractClickHouseError ──────────────────────────────────────────

describe('extractClickHouseError', () => {
	it('extracts error from response.body', () => {
		const error = { response: { body: 'Code: 60. DB::Exception: Table not found' } };
		expect(extractClickHouseError(error)).toContain('Table not found');
	});

	it('extracts error from cause.body', () => {
		const error = { cause: { body: 'Code: 62. Syntax error' } };
		expect(extractClickHouseError(error)).toContain('Syntax error');
	});

	it('falls back to message', () => {
		const error = { message: 'Connection refused' };
		expect(extractClickHouseError(error)).toContain('Connection refused');
	});

	it('falls back to String() for primitives', () => {
		expect(extractClickHouseError('raw string')).toBe('raw string');
	});

	it('strips stack traces', () => {
		const error = { message: 'Fail\n    at Module._compile (file.js:1)\n    at next' };
		const result = extractClickHouseError(error);
		expect(result).not.toContain('at Module');
	});

	it('strips absolute file paths', () => {
		const error = {
			message: 'Error at /usr/src/clickhouse/db/parser.cpp:42 something',
		};
		const result = extractClickHouseError(error);
		expect(result).not.toContain('/usr/src');
		expect(result).toContain('[internal]');
	});
});

// ── applyColumnMapping ─────────────────────────────────────────────

describe('applyColumnMapping', () => {
	it('returns row as-is when no mappings provided', () => {
		const row = { name: 'Alice', age: 30 };
		expect(applyColumnMapping(row, [], false)).toEqual({ name: 'Alice', age: 30 });
	});

	it('renames fields according to mappings', () => {
		const row = { userName: 'Alice', userAge: 30, extra: 'keep' };
		const mappings = [
			{ sourceField: 'userName', targetColumn: 'user_name' },
			{ sourceField: 'userAge', targetColumn: 'user_age' },
		];
		expect(applyColumnMapping(row, mappings, false)).toEqual({
			user_name: 'Alice',
			user_age: 30,
			extra: 'keep',
		});
	});

	it('only includes mapped fields when onlyMapped is true', () => {
		const row = { userName: 'Alice', userAge: 30, extra: 'skip' };
		const mappings = [
			{ sourceField: 'userName', targetColumn: 'user_name' },
		];
		expect(applyColumnMapping(row, mappings, true)).toEqual({
			user_name: 'Alice',
		});
	});

	it('skips mappings with empty sourceField or targetColumn', () => {
		const row = { a: 1, b: 2 };
		const mappings = [
			{ sourceField: '', targetColumn: 'x' },
			{ sourceField: 'a', targetColumn: '' },
		];
		expect(applyColumnMapping(row, mappings, false)).toEqual({ a: 1, b: 2 });
	});

	it('handles missing source fields gracefully in onlyMapped mode', () => {
		const row = { a: 1 };
		const mappings = [
			{ sourceField: 'a', targetColumn: 'x' },
			{ sourceField: 'missing', targetColumn: 'y' },
		];
		expect(applyColumnMapping(row, mappings, true)).toEqual({ x: 1 });
	});
});

// ── parseQueryStats ────────────────────────────────────────────────

describe('parseQueryStats', () => {
	it('parses valid JSON summary header', () => {
		const header = '{"read_rows":"100","read_bytes":"4096","elapsed_ns":"12345"}';
		const stats = parseQueryStats(header);
		expect(stats).toEqual({
			read_rows: '100',
			read_bytes: '4096',
			elapsed_ns: '12345',
		});
	});

	it('returns null for undefined header', () => {
		expect(parseQueryStats(undefined)).toBeNull();
	});

	it('returns null for invalid JSON', () => {
		expect(parseQueryStats('not-json')).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(parseQueryStats('')).toBeNull();
	});
});

// ── inferClickHouseType ────────────────────────────────────────────

describe('inferClickHouseType', () => {
	it('infers String for regular strings', () => {
		expect(inferClickHouseType('hello')).toBe('String');
	});

	it('infers Int64 for integers', () => {
		expect(inferClickHouseType(42)).toBe('Int64');
		expect(inferClickHouseType(0)).toBe('Int64');
		expect(inferClickHouseType(-100)).toBe('Int64');
	});

	it('infers Float64 for floating point numbers', () => {
		expect(inferClickHouseType(3.14)).toBe('Float64');
	});

	it('infers Bool for booleans', () => {
		expect(inferClickHouseType(true)).toBe('Bool');
		expect(inferClickHouseType(false)).toBe('Bool');
	});

	it('infers DateTime for ISO date strings', () => {
		expect(inferClickHouseType('2024-01-15T10:30:00Z')).toBe('DateTime');
		expect(inferClickHouseType('2024-01-15T10:30:00.000Z')).toBe('DateTime');
	});

	it('infers Date for date-only strings', () => {
		expect(inferClickHouseType('2024-01-15')).toBe('Date');
	});

	it('infers UUID for UUID strings', () => {
		expect(inferClickHouseType('550e8400-e29b-41d4-a716-446655440000')).toBe('UUID');
	});

	it('infers Nullable(String) for null and undefined', () => {
		expect(inferClickHouseType(null)).toBe('Nullable(String)');
		expect(inferClickHouseType(undefined)).toBe('Nullable(String)');
	});

	it('infers Array types', () => {
		expect(inferClickHouseType(['a', 'b'])).toBe('Array(String)');
		expect(inferClickHouseType([1, 2, 3])).toBe('Array(Int64)');
		expect(inferClickHouseType([])).toBe('Array(String)');
	});

	it('infers String for objects', () => {
		expect(inferClickHouseType({ key: 'value' })).toBe('String');
	});
});

// ── buildCreateTableDDL ────────────────────────────────────────────

describe('buildCreateTableDDL', () => {
	it('builds basic MergeTree DDL', () => {
		const ddl = buildCreateTableDDL({
			table: 'events',
			database: 'default',
			columns: [
				{ name: 'id', type: 'UInt64' },
				{ name: 'name', type: 'String' },
			],
			engine: 'MergeTree',
			orderBy: 'id',
			ifNotExists: true,
		});
		expect(ddl).toBe(
			'CREATE TABLE IF NOT EXISTS `default`.`events` (`id` UInt64, `name` String) ENGINE = MergeTree() ORDER BY (id)',
		);
	});

	it('builds DDL without IF NOT EXISTS', () => {
		const ddl = buildCreateTableDDL({
			table: 'events',
			database: 'default',
			columns: [{ name: 'id', type: 'UInt64' }],
			engine: 'MergeTree',
			orderBy: 'id',
			ifNotExists: false,
		});
		expect(ddl).toContain('CREATE TABLE `default`');
		expect(ddl).not.toContain('IF NOT EXISTS');
	});

	it('includes PARTITION BY when provided', () => {
		const ddl = buildCreateTableDDL({
			table: 'events',
			database: 'default',
			columns: [
				{ name: 'id', type: 'UInt64' },
				{ name: 'created_at', type: 'DateTime' },
			],
			engine: 'MergeTree',
			orderBy: 'id',
			ifNotExists: true,
			partitionBy: 'toYYYYMM(created_at)',
		});
		expect(ddl).toContain('PARTITION BY toYYYYMM(created_at)');
	});

	it('includes TTL when provided', () => {
		const ddl = buildCreateTableDDL({
			table: 'events',
			database: 'default',
			columns: [
				{ name: 'id', type: 'UInt64' },
				{ name: 'created_at', type: 'DateTime' },
			],
			engine: 'MergeTree',
			orderBy: 'id',
			ifNotExists: true,
			ttl: 'created_at + INTERVAL 90 DAY',
		});
		expect(ddl).toContain('TTL created_at + INTERVAL 90 DAY');
	});

	it('builds Memory engine DDL without ORDER BY', () => {
		const ddl = buildCreateTableDDL({
			table: 'tmp',
			database: 'default',
			columns: [{ name: 'x', type: 'Int32' }],
			engine: 'Memory',
			orderBy: '',
			ifNotExists: true,
		});
		expect(ddl).toBe(
			'CREATE TABLE IF NOT EXISTS `default`.`tmp` (`x` Int32) ENGINE = Memory()',
		);
		expect(ddl).not.toContain('ORDER BY');
	});

	it('rejects invalid table names', () => {
		expect(() =>
			buildCreateTableDDL({
				table: 'DROP TABLE; --',
				database: 'default',
				columns: [{ name: 'id', type: 'UInt64' }],
				engine: 'MergeTree',
				orderBy: 'id',
				ifNotExists: true,
			}),
		).toThrow('Invalid table name');
	});

	it('rejects invalid column names', () => {
		expect(() =>
			buildCreateTableDDL({
				table: 'events',
				database: 'default',
				columns: [{ name: 'bad column', type: 'UInt64' }],
				engine: 'MergeTree',
				orderBy: 'id',
				ifNotExists: true,
			}),
		).toThrow('Invalid column name');
	});
});
