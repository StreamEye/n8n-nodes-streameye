"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreameyeOAuth2Api = void 0;
class StreameyeOAuth2Api {
    constructor() {
        this.name = 'streameyeOAuth2Api';
        this.extends = ['oAuth2Api'];
        this.displayName = 'Streameye OAuth2 API';
        this.documentationUrl = 'https://github.com/StreamEye/n8n-nodes-streameye?tab=readme-ov-file#credentials';
        this.icon = {
            light: 'file:../nodes/Streameye/streameye.svg',
            dark: 'file:../nodes/Streameye/streameye.dark.svg',
        };
        this.properties = [
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
        this.test = {
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
}
exports.StreameyeOAuth2Api = StreameyeOAuth2Api;
//# sourceMappingURL=StreameyeOAuth2Api.credentials.js.map