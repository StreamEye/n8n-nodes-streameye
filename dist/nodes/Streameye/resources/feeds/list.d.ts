import type { INodeProperties } from 'n8n-workflow';
export declare const feedListOperation: {
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
export declare const feedListDescription: INodeProperties[];
