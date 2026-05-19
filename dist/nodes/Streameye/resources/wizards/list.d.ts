import type { IDataObject, INodeProperties } from 'n8n-workflow';
export declare const wizardListOperation: {
    responseKey: string;
    query: string;
    getVariables: (executeFunctions: import("n8n-workflow").IExecuteFunctions, itemIndex: number) => {
        filter: IDataObject | undefined;
        orderBy: {
            key: string;
            dir: string;
        }[] | undefined;
        from: number;
        size: number;
    };
};
export declare const wizardListDescription: INodeProperties[];
