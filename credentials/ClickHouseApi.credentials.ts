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
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: 'default',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		{
			displayName: 'Protocol',
			name: 'protocol',
			type: 'options',
			options: [
				{ name: 'HTTP', value: 'http' },
				{ name: 'HTTPS', value: 'https' },
			],
			default: 'http',
			description: 'Use HTTPS for ClickHouse Cloud (port 8443)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization:
					'=Basic {{Buffer.from($credentials.username + ":" + $credentials.password).toString("base64")}}',
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
