import type { ICredentialTestRequest, ICredentialType, INodeProperties, Icon } from 'n8n-workflow';
export declare class StreameyeOAuth2Api implements ICredentialType {
    name: string;
    extends: string[];
    displayName: string;
    documentationUrl: string;
    icon: Icon;
    properties: INodeProperties[];
    test: ICredentialTestRequest;
}
