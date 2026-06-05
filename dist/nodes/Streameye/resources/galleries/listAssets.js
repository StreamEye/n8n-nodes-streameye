"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.galleryListAssetsDescription = exports.galleryListAssetsOperation = void 0;
const inputHelpers_1 = require("../../helpers/inputHelpers");
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
exports.galleryListAssetsOperation = {
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
        const page = getNumberParameterWithLegacyFallback(executeFunctions, itemIndex, 'galleryAssetPage', 'page', 1);
        const pageSize = getNumberParameterWithLegacyFallback(executeFunctions, itemIndex, 'galleryAssetPageSize', 'pageSize', 100);
        const keyword = executeFunctions.getNodeParameter('keyword', itemIndex);
        const filters = executeFunctions.getNodeParameter('filters', itemIndex, {});
        const sortField = executeFunctions.getNodeParameter('sortField', itemIndex, '');
        const sortDirection = executeFunctions.getNodeParameter('sortDirection', itemIndex, 'asc');
        const filter = {
            ...(0, inputHelpers_1.compactObject)({
                category: filters.category ? { eq: filters.category } : undefined,
            }),
            gid: executeFunctions.getNodeParameter('gid', itemIndex),
            keyword: keyword !== null && keyword !== void 0 ? keyword : '',
        };
        const orderBy = sortField ? [{ key: sortField, dir: sortDirection }] : undefined;
        return {
            filter,
            orderBy,
            from: (page - 1) * pageSize,
            size: pageSize,
        };
    },
};
exports.galleryListAssetsDescription = [
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
//# sourceMappingURL=listAssets.js.map