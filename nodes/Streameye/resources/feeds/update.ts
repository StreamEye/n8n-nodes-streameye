import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { unzipJson, zipJson } from '../../helpers/compression';
import { compactObject } from '../../helpers/inputHelpers';
import type { ValidatedResourceOperation } from '../types';
import { loadFeedForUpdate, validateFeedInput } from './validateFeedData';

export const feedUpdateOperation = {
	responseKey: 'n8nUpdateFeed',
	query: `mutation StreameyeFeedUpdate($input: N8nFeedUpdateInput!) {
		n8nUpdateFeed(input: $input) {
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
		const id = executeFunctions.getNodeParameter('id', itemIndex) as string;
		const lang = executeFunctions.getNodeParameter('lang', itemIndex, '') as string;
		const rawData = executeFunctions.getNodeParameter('data', itemIndex);

		const { wid, existingData } = await loadFeedForUpdate(makeRequest, id);

		return await validateFeedInput(
			executeFunctions,
			makeRequest,
			wid,
			lang,
			rawData,
			parseJsonParameter,
			existingData,
		);
	},
	getVariables: async (executeFunctions, itemIndex, parseJsonParameter, validatedData) => {
		const additionalFields = executeFunctions.getNodeParameter(
			'additionalFields',
			itemIndex,
			{},
		) as IDataObject;
		const looping = (additionalFields.looping as number | undefined) ?? 0;

		const dataObj = validatedData ?? (() => {
			const parsed = parseJsonParameter(
				executeFunctions.getNodeParameter('data', itemIndex),
				'Data',
			);
			if (parsed === undefined) throw new Error('Data is required');
			return Array.isArray(parsed) ? parsed[0] : parsed;
		})();

		return compactObject({
			input: compactObject({
				id: executeFunctions.getNodeParameter('id', itemIndex) as string,
				name: executeFunctions.getNodeParameter('name', itemIndex, '') as string,
				lang: executeFunctions.getNodeParameter('lang', itemIndex, '') as string,
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

export const feedUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Feed ID',
		name: 'id',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['update'],
			},
		},
		default: '',
		description: 'ID of the feed to update',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['update'],
			},
		},
		default: '',
		description: 'Name of the feed',
	},
	{
		displayName: 'Language',
		name: 'lang',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['update'],
			},
		},
		default: '',
		description: 'Language (locale) for the feed, e.g. "en"',
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['update'],
			},
		},
		default: '{}',
		description: 'Feed data as JSON. Sent to the API as N8nFeedUpdateInput data.',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['update'],
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
				default: 0,
				description: 'Optional number of loops for the feed. Leave at 0 to keep the current value.',
			},
		],
	},
];
