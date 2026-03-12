/**
 * Pure utility functions for ClickHouse HTTP interface communication.
 * Uses ONLY Node.js built-ins — no npm imports.
 */

export interface ClickHouseCredentials {
	host: string;
	port: number;
	database: string;
	username: string;
	password: string;
	protocol: string;
}

export interface QueryParam {
	name: string;
	value: string;
}

export function buildBaseUrl(credentials: ClickHouseCredentials): string {
	return `${credentials.protocol}://${credentials.host}:${credentials.port}`;
}

export function buildAuthHeader(credentials: ClickHouseCredentials): string {
	const token = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
	return `Basic ${token}`;
}

export function buildUrlParams(
	database: string,
	settings?: string,
	queryParams?: QueryParam[],
): string {
	const params: string[] = [`database=${encodeURIComponent(database)}`];

	if (queryParams && queryParams.length > 0) {
		for (const param of queryParams) {
			params.push(`param_${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`);
		}
	}

	if (settings) {
		try {
			const parsed = JSON.parse(settings) as Record<string, unknown>;
			for (const [key, value] of Object.entries(parsed)) {
				params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
			}
		} catch {
			// If settings is not valid JSON, ignore it
		}
	}

	return params.join('&');
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		chunks.push(arr.slice(i, i + size));
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

export function extractClickHouseError(error: unknown): string {
	if (error && typeof error === 'object') {
		const err = error as Record<string, unknown>;
		// n8n httpRequest errors often have the response body in error.response.body
		if (err.response && typeof err.response === 'object') {
			const response = err.response as Record<string, unknown>;
			if (typeof response.body === 'string') {
				return response.body;
			}
		}
		// Some errors have a cause with a body
		if (err.cause && typeof err.cause === 'object') {
			const cause = err.cause as Record<string, unknown>;
			if (typeof cause.body === 'string') {
				return cause.body;
			}
		}
		if (typeof err.message === 'string') {
			return err.message;
		}
	}
	return String(error);
}
