import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { unzipJson } from '../../helpers/compression';
import type { ResourceOperation } from '../types';

export const feedGetByIdOperation = {
	responseKey: 'n8nGetFeedById',
	query: `query StreameyeFeedGetById($id: String!) {
		n8nGetFeedById(id: $id) {
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
	getVariables: (executeFunctions, itemIndex) => ({
		id: executeFunctions.getNodeParameter('id', itemIndex) as string,
	}),
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
} satisfies ResourceOperation;

export const feedGetByIdDescription: INodeProperties[] = [
	{
		displayName: 'Feed ID',
		name: 'id',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['getById'],
			},
		},
		default: '',
		description: 'ID of the feed to retrieve',
	},
];
