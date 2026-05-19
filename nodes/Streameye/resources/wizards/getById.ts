import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { unzipJson } from '../../helpers/compression';
import type { ResourceOperation } from '../types';

export const wizardGetByIdOperation = {
	responseKey: 'n8nGetWizardById',
	query: `query StreameyeWizardGetById($id: String!) {
		n8nGetWizardById(id: $id) {
			schema
			data
			languages
			galleries
		}
	}`,
	getVariables: (executeFunctions, itemIndex) => ({
		id: executeFunctions.getNodeParameter('id', itemIndex) as string,
	}),
	transformResponse: async (response) => {
		const wizardStepData = response as IDataObject | undefined;

		if (!wizardStepData) {
			return response;
		}

		return {
			...wizardStepData,
			schema: await unzipJson(wizardStepData.schema as string),
			data: await unzipJson(wizardStepData.data as string),
			// languages and galleries come back from GraphQL as plain string arrays (not compressed).
			languages: (wizardStepData.languages as string[] | undefined) ?? [],
			galleries: (wizardStepData.galleries as string[] | undefined) ?? [],
		};
	},
} satisfies ResourceOperation;

export const wizardGetByIdDescription: INodeProperties[] = [
	{
		displayName: 'Wizard ID',
		name: 'id',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['wizards'],
				operation: ['getById'],
			},
		},
		default: '',
		description: 'ID of the wizard to retrieve',
	},
];
