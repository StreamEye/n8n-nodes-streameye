"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedListDescription = exports.feedListOperation = void 0;
const inputHelpers_1 = require("../../helpers/inputHelpers");
const addDateRangeFilter = (filter, key, gte, lte) => {
    const dateFilter = {};
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
const getNumberParameterWithLegacyFallback = (executeFunctions, itemIndex, name, legacyName, defaultValue) => {
    const nodeParameters = executeFunctions.getNode().parameters;
    if (Object.prototype.hasOwnProperty.call(nodeParameters, name)) {
        return executeFunctions.getNodeParameter(name, itemIndex);
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
exports.feedListOperation = {
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
        const page = getNumberParameterWithLegacyFallback(executeFunctions, itemIndex, 'feedPage', 'page', 1);
        const pageSize = getNumberParameterWithLegacyFallback(executeFunctions, itemIndex, 'feedPageSize', 'pageSize', 100);
        const keyword = executeFunctions.getNodeParameter('keyword', itemIndex);
        const type = executeFunctions.getNodeParameter('type', itemIndex);
        const filters = executeFunctions.getNodeParameter('filters', itemIndex, {});
        const nodeParameters = executeFunctions.getNode().parameters;
        const wid = Object.prototype.hasOwnProperty.call(nodeParameters, 'wid')
            ? executeFunctions.getNodeParameter('wid', itemIndex)
            : filters.wid;
        const sortField = executeFunctions.getNodeParameter('sortField', itemIndex, '');
        const sortDirection = executeFunctions.getNodeParameter('sortDirection', itemIndex, 'asc');
        const filter = {
            ...(0, inputHelpers_1.compactObject)({
                wid,
                type,
            }),
            keyword: keyword !== null && keyword !== void 0 ? keyword : '',
        };
        addDateRangeFilter(filter, 'createdAt', filters.createdAtFrom, filters.createdAtTo);
        addDateRangeFilter(filter, 'updatedAt', filters.updatedAtFrom, filters.updatedAtTo);
        const orderBy = sortField ? [{ key: sortField, dir: sortDirection }] : undefined;
        return {
            filter,
            orderBy,
            from: (page - 1) * pageSize,
            size: pageSize,
        };
    },
    transformResponse: (response) => {
        const feedConnection = response;
        if (!feedConnection || typeof feedConnection.items !== 'string') {
            return response;
        }
        return JSON.parse(feedConnection.items);
    },
};
exports.feedListDescription = [
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
                name: 'None',
                value: '',
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
                name: 'Type',
                value: 'type',
            },
            {
                name: 'Wizard ID',
                value: 'wid',
            },
            {
                name: 'Created At',
                value: 'createdAt',
            },
            {
                name: 'Updated At',
                value: 'updatedAt',
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
//# sourceMappingURL=list.js.map