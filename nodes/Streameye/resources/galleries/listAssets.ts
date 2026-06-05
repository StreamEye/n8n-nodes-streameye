import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { compactObject } from '../../helpers/inputHelpers';
import type { ResourceOperation } from '../types';

const getNumberParameterWithLegacyFallback = (
	executeFunctions: Parameters<ResourceOperation['getVariables']>[0],
	itemIndex: number,
	name: string,
	legacyName: string,
	defaultValue: number,
): number => {
	const nodeParameters = executeFunctions.getNode().parameters as IDataObject;

	if (Object.prototype.hasOwnProperty.call(nodeParameters, name)) {
		return executeFunctions.getNodeParameter(name, itemIndex) as number;
	}

	const legacyValue = nodeParameters[legacyName];
	if (typeof legacyValue === 'number') {
		return legacyValue;
	}

	if (typeof legacyValue === 'string' && legacyValue.trim() !== '') {
		const parsedValue = Number(legacyValue);

		if (!Number.isNaN(parsedValue)) {
			return parsedValue;
		}
	}

	return defaultValue;
};

export const galleryListAssetsOperation = {
	responseKey: 'n8nListAssets',
	query: `query StreameyeGalleryListGalleryAssets($filter: GalleryAssetFilterInput, $orderBy: [OrderByFilterInput], $from: Int!, $size: Int!) {
		n8nListAssets(filter: $filter, orderBy: $orderBy, from: $from, size: $size) {
			items {
				id
				name
				thumb
				url
				createdAt
				updatedAt
			}
			total
		}
	}`,
	getVariables: (executeFunctions, itemIndex) => {
		const page = getNumberParameterWithLegacyFallback(
			executeFunctions,
			itemIndex,
			'galleryAssetPage',
			'page',
			1,
		);
		const pageSize = getNumberParameterWithLegacyFallback(
			executeFunctions,
			itemIndex,
			'galleryAssetPageSize',
			'pageSize',
			100,
		);
		const keyword = executeFunctions.getNodeParameter('keyword', itemIndex) as string;
		const filters = executeFunctions.getNodeParameter('filters', itemIndex, {}) as IDataObject;
		const sortField = executeFunctions.getNodeParameter('sortField', itemIndex, '') as string;
		const sortDirection = executeFunctions.getNodeParameter('sortDirection', itemIndex, 'asc') as string;

		const filter = {
			...compactObject({
				category: filters.category ? { eq: filters.category } : undefined,
			}),
			gid: executeFunctions.getNodeParameter('gid', itemIndex) as string,
			keyword: keyword ?? '',
		};

		const orderBy = sortField ? [{ key: sortField, dir: sortDirection }] : undefined;

		return {
			filter,
			orderBy,
			from: (page - 1) * pageSize,
			size: pageSize,
		};
	},
} satisfies ResourceOperation;

export const galleryListAssetsDescription: INodeProperties[] = [
	{
		displayName: 'Gallery ID',
		name: 'gid',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['galleries'],
				operation: ['listGalleryAssets'],
			},
		},
		default: '',
		description: 'ID of the gallery whose assets to list',
	},
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['galleries'],
				operation: ['listGalleryAssets'],
			},
		},
		default: '',
		description: 'Search keyword',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		displayOptions: {
			show: {
				resource: ['galleries'],
				operation: ['listGalleryAssets'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Category',
				name: 'category',
				type: 'string',
				default: '',
				description: 'Only return assets in this category',
			},
		],
	},
	{
		displayName: 'Order By',
		name: 'sortField',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['galleries'],
				operation: ['listGalleryAssets'],
			},
		},
		options: [
			{
				name: 'Created At',
				value: 'createdAt',
			},
			{
				name: 'ID',
				value: 'id',
			},
			{
				name: 'Name',
				value: 'name',
			},
			{
				name: 'None',
				value: '',
			},
			{
				name: 'Updated At',
				value: 'updatedAt',
			},
		],
		default: 'updatedAt',
		description: 'Field to sort the gallery asset list by',
	},
	{
		displayName: 'Order Direction',
		name: 'sortDirection',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['galleries'],
				operation: ['listGalleryAssets'],
			},
		},
		options: [
			{
				name: 'Ascending',
				value: 'asc',
			},
			{
				name: 'Descending',
				value: 'desc',
			},
		],
		default: 'desc',
	},
	{
		displayName: 'Page',
		name: 'galleryAssetPage',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['galleries'],
				operation: ['listGalleryAssets'],
			},
		},
		default: 1,
		description: 'Page of results to return',
	},
	{
		displayName: 'Page Size',
		name: 'galleryAssetPageSize',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['galleries'],
				operation: ['listGalleryAssets'],
			},
		},
		default: 100,
		description: 'Number of records to return per page',
	},
];
