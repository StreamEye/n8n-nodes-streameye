import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { compactObject } from '../../helpers/inputHelpers';
import type { ResourceOperation } from '../types';

const addDateRangeFilter = (
	filter: IDataObject,
	key: 'createdAt' | 'updatedAt',
	gte?: string,
	lte?: string,
): void => {
	const dateFilter: IDataObject = {};

	if (gte) {
		dateFilter.gte = gte;
	}

	if (lte) {
		dateFilter.lte = lte;
	}

	if (Object.keys(dateFilter).length > 0) {
		filter[key] = dateFilter;
	}
};

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

export const feedListOperation = {
	responseKey: 'n8nListFeeds',
	query: `query StreameyeFeedList($filter: N8nFeedFilterInput, $orderBy: [OrderByFilterInput], $from: Int!, $size: Int!) {
		n8nListFeeds(filter: $filter, orderBy: $orderBy, from: $from, size: $size) {
			items {
				id
				name
				wid
				createdAt
				updatedAt
				rev
				type
			}
			total
		}
	}`,
	getVariables: (executeFunctions, itemIndex) => {
		const page = getNumberParameterWithLegacyFallback(
			executeFunctions,
			itemIndex,
			'feedPage',
			'page',
			1,
		);
		const pageSize = getNumberParameterWithLegacyFallback(
			executeFunctions,
			itemIndex,
			'feedPageSize',
			'pageSize',
			100,
		);
		const keyword = executeFunctions.getNodeParameter('keyword', itemIndex) as string;
		const type = executeFunctions.getNodeParameter('type', itemIndex) as string;
		const filters = executeFunctions.getNodeParameter('filters', itemIndex, {}) as IDataObject;
		const nodeParameters = executeFunctions.getNode().parameters as IDataObject;
		const wid = Object.prototype.hasOwnProperty.call(nodeParameters, 'wid')
			? (executeFunctions.getNodeParameter('wid', itemIndex) as string)
			: filters.wid;
		const sortField = executeFunctions.getNodeParameter('sortField', itemIndex, '') as string;
		const sortDirection = executeFunctions.getNodeParameter('sortDirection', itemIndex, 'asc') as string;

		const filter = {
			...compactObject({
				wid,
				type,
			}),
			keyword: keyword ?? '',
		};

		addDateRangeFilter(
			filter,
			'createdAt',
			filters.createdAtFrom as string | undefined,
			filters.createdAtTo as string | undefined,
		);
		addDateRangeFilter(
			filter,
			'updatedAt',
			filters.updatedAtFrom as string | undefined,
			filters.updatedAtTo as string | undefined,
		);

		const orderBy = sortField ? [{ key: sortField, dir: sortDirection }] : undefined;

		return {
			filter,
			orderBy,
			from: (page - 1) * pageSize,
			size: pageSize,
		};
	},
	transformResponse: (response) => {
		const feedConnection = response as IDataObject | undefined;

		if (!feedConnection || typeof feedConnection.items !== 'string') {
			return response;
		}

		return JSON.parse(feedConnection.items) as IDataObject[];
	},
} satisfies ResourceOperation;

export const feedListDescription: INodeProperties[] = [
	{
		displayName: 'Wizard ID',
		name: 'wid',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['list'],
			},
		},
		default: '',
		description: 'Only return feeds created from this wizard ID',
	},
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['list'],
			},
		},
		default: '',
		description: 'Search keyword',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['list'],
			},
		},
		default: '',
		options: [
			{
				name: 'Any',
				value: '',
			},
			{
				name: 'Builder',
				value: 'builder',
			},
			{
				name: 'HTML5',
				value: 'html5',
			},
			{
				name: 'Video',
				value: 'video',
			},
		],
		description: 'Wizard type to filter by',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['list'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Created At From',
				name: 'createdAtFrom',
				type: 'dateTime',
				default: '',
				description: 'Return feeds created at or after this date',
			},
			{
				displayName: 'Created At To',
				name: 'createdAtTo',
				type: 'dateTime',
				default: '',
				description: 'Return feeds created at or before this date',
			},
			{
				displayName: 'Updated At From',
				name: 'updatedAtFrom',
				type: 'dateTime',
				default: '',
				description: 'Return feeds updated at or after this date',
			},
			{
				displayName: 'Updated At To',
				name: 'updatedAtTo',
				type: 'dateTime',
				default: '',
				description: 'Return feeds updated at or before this date',
			},
		],
	},
	{
		displayName: 'Order By',
		name: 'sortField',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['list'],
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
				name: 'Type',
				value: 'type',
			},
			{
				name: 'Updated At',
				value: 'updatedAt',
			},
			{
				name: 'Wizard ID',
				value: 'wid',
			},
		],
		default: 'updatedAt',
		description: 'Field to sort the feed list by',
	},
	{
		displayName: 'Order Direction',
		name: 'sortDirection',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['list'],
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
		name: 'feedPage',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['list'],
			},
		},
		default: 1,
		description: 'Page of results to return',
	},
	{
		displayName: 'Page Size',
		name: 'feedPageSize',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['list'],
			},
		},
		default: 100,
		description: 'Number of records to return per page',
	},
];
