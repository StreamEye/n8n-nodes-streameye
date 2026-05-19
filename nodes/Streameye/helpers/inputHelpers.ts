import type { IDataObject } from 'n8n-workflow';

export const compactObject = (value: IDataObject): IDataObject =>
	Object.fromEntries(
		Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined && fieldValue !== ''),
	) as IDataObject;
