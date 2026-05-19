import type { INodeProperties } from 'n8n-workflow';
export declare const feedGetByIdOperation: {
    responseKey: string;
    query: string;
    getVariables: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number) => {
        id: string;
    };
    transformResponse: (response: unknown) => Promise<unknown>;
};
export declare const feedGetByIdDescription: INodeProperties[];
