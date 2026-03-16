import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ClickHouseApi implements ICredentialType {
	name = 'clickHouseApi';

	displayName = 'ClickHouse API';

	documentationUrl = 'https://clickhouse.com/docs/en/interfaces/http';

	properties: INodeProperties[] = [
		{
			displayName: 'Host',
			name: 'host',
			type: 'string',
			default: 'localhost',
			placeholder: 'localhost',
			description: 'Hostname of the ClickHouse server (no protocol or port)',
		},
		{
			displayName: 'Port',
			name: 'port',
			type: 'number',
			default: 8123,
			description: 'HTTP port of the ClickHouse server (8123 for HTTP, 8443 for HTTPS)',
		},
		{
			displayName: 'Database',
			name: 'database',
			type: 'string',
			default: 'default',
			description: 'Default database to use',
		},
		{
			displayName: 'Auth Method',
			name: 'authMethod',
			type: 'options',
			options: [
				{
					name: 'Basic Auth (Username/Password)',
					value: 'basicAuth',
					description: 'Authenticate with username and password. Works with all ClickHouse deployments.',
				},
				{
					name: 'JWT Bearer Token',
					value: 'bearerToken',
					description: 'Authenticate with a JWT token. Common for ClickHouse Cloud and enterprise SSO.',
				},
			],
			default: 'basicAuth',
			description: 'Authentication method to use when connecting to ClickHouse',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: 'default',
			displayOptions: {
				show: {
					authMethod: ['basicAuth'],
				},
			},
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			displayOptions: {
				show: {
					authMethod: ['basicAuth'],
				},
			},
		},
		{
			displayName: 'JWT Token',
			name: 'jwtToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'JWT bearer token for authentication',
			displayOptions: {
				show: {
					authMethod: ['bearerToken'],
				},
			},
		},
		{
			displayName: 'Protocol',
			name: 'protocol',
			type: 'options',
			options: [
				{
					name: 'HTTP',
					value: 'http',
					description: 'Unencrypted — credentials are sent in plaintext. Use only for local/trusted networks.',
				},
				{
					name: 'HTTPS (Recommended)',
					value: 'https',
					description: 'Encrypted connection. Required for ClickHouse Cloud (port 8443).',
				},
			],
			default: 'http',
			description: 'HTTPS is strongly recommended. HTTP transmits credentials in plaintext.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization:
					'={{ $credentials.authMethod === "bearerToken" ? "Bearer " + $credentials.jwtToken : "Basic " + Buffer.from(($credentials.username || "default") + ":" + ($credentials.password || "")).toString("base64") }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{$credentials.protocol}}://{{$credentials.host}}:{{$credentials.port}}',
			url: '/',
			method: 'POST',
			qs: {
				database: '={{$credentials.database}}',
			},
			body: 'SELECT 1',
			headers: {
				'Content-Type': 'text/plain',
			},
		},
	};
}
