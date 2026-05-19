import type { INodeProperties } from 'n8n-workflow';
import { compactObject } from '../../helpers/inputHelpers';
import { SkipItemError } from '../../helpers/skipItemError';
import type { ResourceOperation } from '../types';

export const feedGetPermalinksOperation = {
	responseKey: 'n8nGetPermalinks',
	query: `mutation StreameyeFeedGetPermalinks($id: String!) {
		n8nGetPermalinks(id: $id)
	}`,
	getVariables: (executeFunctions, itemIndex) => {
		const incoming = executeFunctions.getInputData()[itemIndex]?.json ?? {};
		if (incoming.type === 'html5') {
			throw new SkipItemError('Get Permalinks is not supported for html5 feeds — item skipped');
		}

		return compactObject({
			id: executeFunctions.getNodeParameter('id', itemIndex) as string,
		});
	},
} satisfies ResourceOperation;

export const feedGetPermalinksDescription: INodeProperties[] = [
	{
		displayName: 'Feed ID',
		name: 'id',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['getPermalinks'],
			},
		},
		default: '',
		description: 'ID of the feed to get permalinks for',
	},
];
