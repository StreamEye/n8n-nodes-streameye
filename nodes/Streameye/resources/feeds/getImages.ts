import type { INodeProperties } from 'n8n-workflow';
import { compactObject } from '../../helpers/inputHelpers';
import { SkipItemError } from '../../helpers/skipItemError';
import type { ResourceOperation } from '../types';

export const feedGetImagesOperation = {
	responseKey: 'n8nGetImages',
	query: `mutation StreameyeFeedGetImages($id: String!, $quality: Int, $type: String) {
		n8nGetImages(id: $id, quality: $quality, type: $type)
	}`,
	getVariables: (executeFunctions, itemIndex) => {
		const incoming = executeFunctions.getInputData()[itemIndex]?.json ?? {};
		if (incoming.type === 'html5') {
			throw new SkipItemError('Get Images is not supported for html5 feeds — item skipped');
		}

		return compactObject({
			id: executeFunctions.getNodeParameter('id', itemIndex) as string,
			quality: executeFunctions.getNodeParameter('quality', itemIndex, 93) as number,
			type: executeFunctions.getNodeParameter('type', itemIndex, 'jpg') as string,
		});
	},
} satisfies ResourceOperation;

export const feedGetImagesDescription: INodeProperties[] = [
	{
		displayName: 'Feed ID',
		name: 'id',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['getImages'],
			},
		},
		default: '',
		description: 'ID of the feed to get images for',
	},
	{
		displayName: 'Quality',
		name: 'quality',
		type: 'number',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['getImages'],
			},
		},
		default: 93,
		description: 'Image quality',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: [
			{
				name: 'JPG',
				value: 'jpg',
			},
			{
				name: 'PNG',
				value: 'png',
			},
			{
				name: 'WEBP',
				value: 'webp',
			},
		],
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['getImages'],
			},
		},
		default: 'jpg',
		description: 'Image type',
	},
];
