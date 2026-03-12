import {
	validateIdentifier,
	validatePort,
	buildBaseUrl,
	buildAuthHeader,
	buildUrlParams,
	chunkArray,
	parseClickHouseResponse,
	extractClickHouseError,
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
	it('returns a Basic auth header', () => {
		const header = buildAuthHeader(creds);
		const decoded = Buffer.from(header.replace('Basic ', ''), 'base64').toString();
		expect(decoded).toBe('default:secret');
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
