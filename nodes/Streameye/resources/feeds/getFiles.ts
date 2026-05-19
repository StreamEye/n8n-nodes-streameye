import type { INodeProperties } from 'n8n-workflow';
import { compactObject } from '../../helpers/inputHelpers';
import type { ResourceOperation } from '../types';

export const feedGetFilesOperation = {
	responseKey: 'n8nDownloadFeedFiles',
	query: `query StreameyeFeedGetFiles($id: String!) {
		n8nDownloadFeedFiles(id: $id)
	}`,
	getVariables: (executeFunctions, itemIndex) => {
		return compactObject({
			id: executeFunctions.getNodeParameter('id', itemIndex) as string,
		});
	},
} satisfies ResourceOperation;

export const feedGetFilesDescription: INodeProperties[] = [
	{
		displayName: 'Feed ID',
		name: 'id',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['getFiles'],
			},
		},
		default: '',
		description: 'ID of the feed to download files for',
	},
];
