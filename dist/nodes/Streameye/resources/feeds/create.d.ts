import type { IDataObject, INodeProperties } from 'n8n-workflow';
export declare const feedCreateOperation: {
    responseKey: string;
    query: string;
    validate: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number, makeRequest: import("../types").ApiRequest, parseJsonParameter: import("../types").JsonParameterParser) => Promise<IDataObject>;
    getVariables: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number, parseJsonParameter: import("../types").JsonParameterParser, validatedData: IDataObject | undefined) => Promise<IDataObject>;
    transformResponse: (response: unknown) => Promise<unknown>;
};
export declare const feedCreateDescription: INodeProperties[];
