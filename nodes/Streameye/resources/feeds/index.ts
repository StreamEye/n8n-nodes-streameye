import type { INodeProperties } from 'n8n-workflow';
import type { ResourceOperation } from '../types';
import { feedCreateDescription, feedCreateOperation } from './create';
import { feedGetByIdDescription, feedGetByIdOperation } from './getById';
import { feedGetFilesDescription, feedGetFilesOperation } from './getFiles';
import { feedGetImagesDescription, feedGetImagesOperation } from './getImages';
import { feedGetPermalinksDescription, feedGetPermalinksOperation } from './getPermalinks';
import { feedListDescription, feedListOperation } from './list';
import { feedUpdateDescription, feedUpdateOperation } from './update';

export type FeedOperation =
	| 'create'
	| 'getById'
	| 'getFiles'
	| 'getImages'
	| 'getPermalinks'
	| 'list'
	| 'update';

export const feedOperations = {
	create: feedCreateOperation,
	getById: feedGetByIdOperation,
	getFiles: feedGetFilesOperation,
	getImages: feedGetImagesOperation,
	getPermalinks: feedGetPermalinksOperation,
	list: feedListOperation,
	update: feedUpdateOperation,
} satisfies Record<FeedOperation, ResourceOperation>;

export const feedDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['feeds'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a feed',
				description: 'Create a feed',
			},
			{
				name: 'Get by ID',
				value: 'getById',
				action: 'Get a feed by ID',
				description: 'Get a feed by ID',
			},
			{
				name: 'Get Files',
				value: 'getFiles',
				action: 'Get feed files',
				description: 'Download the generated files for a feed',
			},
			{
				name: 'Get Images',
				value: 'getImages',
				action: 'Get feed images',
				description: 'Get rendered images for a feed',
			},
			{
				name: 'Get Permalinks',
				value: 'getPermalinks',
				action: 'Get feed permalinks',
				description: 'Get permalinks for a feed',
			},
			{
				name: 'List',
				value: 'list',
				action: 'List feeds',
				description: 'List feeds',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a feed',
				description: 'Update a feed',
			},
		],
		default: 'list',
	},
	...feedCreateDescription,
	...feedGetByIdDescription,
	...feedGetFilesDescription,
	...feedGetImagesDescription,
	...feedGetPermalinksDescription,
	...feedListDescription,
	...feedUpdateDescription,
];
