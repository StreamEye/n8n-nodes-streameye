import type { INodeProperties } from 'n8n-workflow';
export type FeedOperation = 'create' | 'getById' | 'getFiles' | 'getImages' | 'getPermalinks' | 'list' | 'update';
export declare const feedOperations: {
    create: {
        responseKey: string;
        query: string;
        validate: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number, makeRequest: import("../types").ApiRequest, parseJsonParameter: import("../types").JsonParameterParser) => Promise<import("n8n-workflow").IDataObject>;
        getVariables: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number, parseJsonParameter: import("../types").JsonParameterParser, validatedData: import("n8n-workflow").IDataObject | undefined) => Promise<import("n8n-workflow").IDataObject>;
        transformResponse: (response: unknown) => Promise<unknown>;
    };
    getById: {
        responseKey: string;
        query: string;
        getVariables: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number) => {
            id: string;
        };
        transformResponse: (response: unknown) => Promise<unknown>;
    };
    getFiles: {
        responseKey: string;
        query: string;
        getVariables: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number) => import("n8n-workflow").IDataObject;
    };
    getImages: {
        responseKey: string;
        query: string;
        getVariables: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number) => import("n8n-workflow").IDataObject;
    };
    getPermalinks: {
        responseKey: string;
        query: string;
        getVariables: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number) => import("n8n-workflow").IDataObject;
    };
    list: {
        responseKey: string;
        query: string;
        getVariables: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number) => {
            filter: {
                keyword: string;
            };
            orderBy: {
                key: string;
                dir: string;
            }[] | undefined;
            from: number;
            size: number;
        };
        transformResponse: (response: unknown) => unknown;
    };
    update: {
        responseKey: string;
        query: string;
        validate: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number, makeRequest: import("../types").ApiRequest, parseJsonParameter: import("../types").JsonParameterParser) => Promise<import("n8n-workflow").IDataObject>;
        getVariables: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number, parseJsonParameter: import("../types").JsonParameterParser, validatedData: import("n8n-workflow").IDataObject | undefined) => Promise<import("n8n-workflow").IDataObject>;
        transformResponse: (response: unknown) => Promise<unknown>;
    };
};
export declare const feedDescription: INodeProperties[];
