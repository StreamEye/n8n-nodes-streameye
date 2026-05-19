import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { unzipJson, zipJson } from '../../helpers/compression';
import { compactObject } from '../../helpers/inputHelpers';
import type { ValidatedResourceOperation } from '../types';
import { validateFeedInput } from './validateFeedData';

export const feedCreateOperation = {
	responseKey: 'n8nCreateFeed',
	query: `mutation StreameyeFeedCreate($input: N8nFeedCreateInput!) {
		n8nCreateFeed(input: $input) {
			id
			rev
			name
			wid
			type
			data
			createdAt
			updatedAt
		}
	}`,
	validate: async (executeFunctions, itemIndex, makeRequest, parseJsonParameter) => {
		const wid = executeFunctions.getNodeParameter('wid', itemIndex) as string;
		const lang = executeFunctions.getNodeParameter('lang', itemIndex) as string;
		const rawData = executeFunctions.getNodeParameter('data', itemIndex);

		return await validateFeedInput(
			executeFunctions,
			makeRequest,
			wid,
			lang,
			rawData,
			parseJsonParameter,
		);
	},
	getVariables: async (executeFunctions, itemIndex, parseJsonParameter, validatedData) => {
		const additionalFields = executeFunctions.getNodeParameter(
			'additionalFields',
			itemIndex,
			{},
		) as IDataObject;
		const looping = (additionalFields.looping as number | undefined) ?? 2;

		const dataObj = validatedData ?? (() => {
			const raw = executeFunctions.getNodeParameter('data', itemIndex);
			const parsed = parseJsonParameter(raw, 'Data');
			if (parsed === undefined) throw new Error('Data is required');
			return Array.isArray(parsed) ? parsed[0] : parsed;
		})();

		return compactObject({
			input: compactObject({
				wid: executeFunctions.getNodeParameter('wid', itemIndex) as string,
				name: executeFunctions.getNodeParameter('name', itemIndex) as string,
				lang: executeFunctions.getNodeParameter('lang', itemIndex) as string,
				looping: looping > 0 ? looping : undefined,
				data: await zipJson(dataObj),
			}),
		});
	},
	transformResponse: async (response) => {
		const feedData = response as IDataObject | undefined;

		if (!feedData) {
			return response;
		}

		return {
			...feedData,
			data: await unzipJson(feedData.data as string),
		};
	},
} satisfies ValidatedResourceOperation;

export const feedCreateDescription: INodeProperties[] = [
	{
		displayName: 'Wizard ID',
		name: 'wid',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'ID of the wizard to create the feed from',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Name of the feed',
	},
	{
		displayName: 'Language',
		name: 'lang',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['create'],
			},
		},
		default: 'en',
		description: 'Language (locale) for the feed, e.g. "en". Must be a language supported by the wizard.',
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['create'],
			},
		},
		default: '{}',
		description: 'Feed data as JSON. Sent to the API as the N8nFeedCreateInput data string.',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['create'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Looping',
				name: 'looping',
				type: 'number',
				typeOptions: {
					minValue: 0,
				},
				default: 2,
				description: 'Optional number of loops for the feed. Defaults to 2.',
			},
		],
	},
];
