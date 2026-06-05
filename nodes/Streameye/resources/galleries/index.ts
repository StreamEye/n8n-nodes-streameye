import type { INodeProperties } from 'n8n-workflow';
import type { ResourceOperation } from '../types';
import { galleryListAssetsDescription, galleryListAssetsOperation } from './listAssets';

export type GalleryOperation = 'listGalleryAssets';

export const galleryOperations = {
	listGalleryAssets: galleryListAssetsOperation,
} satisfies Record<GalleryOperation, ResourceOperation>;

export const galleryDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['galleries'],
			},
		},
		options: [
			{
				name: 'Get Many',
				value: 'listGalleryAssets',
				action: 'Get gallery assets',
				description: 'Get gallery assets',
			},
		],
		default: 'listGalleryAssets',
	},
	...galleryListAssetsDescription,
];
