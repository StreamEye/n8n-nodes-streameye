import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
export type JsonParameterParser = (value: unknown, parameterName: string) => IDataObject | IDataObject[] | undefined;
export type ApiRequest = (query: string, variables: IDataObject) => Promise<IDataObject>;
export type ResourceOperation = {
    responseKey: string;
    query: string;
    getVariables: (executeFunctions: IExecuteFunctions, itemIndex: number, parseJsonParameter: JsonParameterParser, validatedData?: IDataObject) => IDataObject | Promise<IDataObject>;
    transformResponse?: (response: unknown) => Promise<unknown> | unknown;
};
export type ValidatedResourceOperation = ResourceOperation & {
    validate: (executeFunctions: IExecuteFunctions, itemIndex: number, makeRequest: ApiRequest, parseJsonParameter: JsonParameterParser) => Promise<IDataObject | undefined>;
};
export declare const isValidatedOperation: (op: ResourceOperation) => op is ValidatedResourceOperation;
