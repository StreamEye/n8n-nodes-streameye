import type { INodeProperties } from 'n8n-workflow';
export type WizardOperation = 'getById' | 'list';
export declare const wizardOperations: {
    getById: {
        responseKey: string;
        query: string;
        getVariables: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number) => {
            id: string;
        };
        transformResponse: (response: unknown) => Promise<unknown>;
    };
    list: {
        responseKey: string;
        query: string;
        getVariables: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number) => {
            filter: import("n8n-workflow").IDataObject | undefined;
            orderBy: {
                key: string;
                dir: string;
            }[] | undefined;
            from: number;
            size: number;
        };
    };
};
export declare const wizardDescription: INodeProperties[];
