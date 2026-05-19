import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import type { ApiRequest, JsonParameterParser } from '../types';
export declare const validateFeedData: (schema: IDataObject, feedData: IDataObject, wizardInitData?: IDataObject) => Promise<{
    data: IDataObject;
    defaultedFields: string[];
}>;
export declare const loadWizard: (makeRequest: ApiRequest, wid: string) => Promise<{
    schema: IDataObject;
    wizardInitData: IDataObject | undefined;
    languages: string[] | undefined;
}>;
export declare const loadFeedForUpdate: (makeRequest: ApiRequest, id: string) => Promise<{
    wid: string;
    existingData: IDataObject;
}>;
export declare const resolveAssetPickers: (makeRequest: ApiRequest, schema: IDataObject, feedData: IDataObject) => Promise<{
    data: IDataObject;
    resolved: string[];
    removed: string[];
}>;
export declare const validateFeedInput: (executeFunctions: IExecuteFunctions, makeRequest: ApiRequest, wid: string, lang: string, rawData: unknown, parseJsonParameter: JsonParameterParser, existingData?: IDataObject) => Promise<IDataObject>;
