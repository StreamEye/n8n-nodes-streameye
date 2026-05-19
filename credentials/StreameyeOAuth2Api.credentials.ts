import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class StreameyeOAuth2Api implements ICredentialType {
	name = 'streameyeOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Streameye OAuth2 API';

	documentationUrl =
		'https://github.com/StreamEye/n8n-nodes-streameye?tab=readme-ov-file#credentials';

	icon: Icon = {
		light: 'file:../nodes/Streameye/streameye.svg',
		dark: 'file:../nodes/Streameye/streameye.dark.svg',
	};

	properties: INodeProperties[] = [
		{
			displayName: 'API URL',
			name: 'apiUrl',
			type: 'hidden',
			default: 'https://api.streameye.com/graphql',
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://idp.streameye.com/oauth2/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://idp.streameye.com/oauth2/token',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: 'openid email profile',
			description: 'Requested account access scopes',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'header',
		},
	];

	// Verifies the credential by issuing a minimal authenticated GraphQL request to the API.
	// The OAuth2 access token is applied automatically; an auth failure returns a non-2xx
	// status and fails the test.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.apiUrl}}',
			url: '',
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: {
				query: '{ n8nListWizards(from: 0, size: 1) { total } }',
			},
		},
	};
}
