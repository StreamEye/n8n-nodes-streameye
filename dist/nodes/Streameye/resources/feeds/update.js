"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedUpdateDescription = exports.feedUpdateOperation = void 0;
const compression_1 = require("../../helpers/compression");
const inputHelpers_1 = require("../../helpers/inputHelpers");
const validateFeedData_1 = require("./validateFeedData");
exports.feedUpdateOperation = {
    responseKey: 'n8nUpdateFeed',
    query: `mutation StreameyeFeedUpdate($input: N8nFeedUpdateInput!) {
		n8nUpdateFeed(input: $input) {
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
    validate: async (executeFunctions, itemIndex, makeRequest, parseJsonParameter) => {
        const id = executeFunctions.getNodeParameter('id', itemIndex);
        const lang = executeFunctions.getNodeParameter('lang', itemIndex, '');
        const rawData = executeFunctions.getNodeParameter('data', itemIndex);
        const { wid, existingData } = await (0, validateFeedData_1.loadFeedForUpdate)(makeRequest, id);
        return await (0, validateFeedData_1.validateFeedInput)(executeFunctions, makeRequest, wid, lang, rawData, parseJsonParameter, existingData);
    },
    getVariables: async (executeFunctions, itemIndex, parseJsonParameter, validatedData) => {
        var _a;
        const additionalFields = executeFunctions.getNodeParameter('additionalFields', itemIndex, {});
        const looping = (_a = additionalFields.looping) !== null && _a !== void 0 ? _a : 0;
        const dataObj = validatedData !== null && validatedData !== void 0 ? validatedData : (() => {
            const parsed = parseJsonParameter(executeFunctions.getNodeParameter('data', itemIndex), 'Data');
            if (parsed === undefined)
                throw new Error('Data is required');
            return Array.isArray(parsed) ? parsed[0] : parsed;
        })();
        return (0, inputHelpers_1.compactObject)({
            input: (0, inputHelpers_1.compactObject)({
                id: executeFunctions.getNodeParameter('id', itemIndex),
                name: executeFunctions.getNodeParameter('name', itemIndex, ''),
                lang: executeFunctions.getNodeParameter('lang', itemIndex, ''),
                looping: looping > 0 ? looping : undefined,
                data: await (0, compression_1.zipJson)(dataObj),
            }),
        });
    },
    transformResponse: async (response) => {
        const feedData = response;
        if (!feedData) {
            return response;
        }
        return {
            ...feedData,
            data: await (0, compression_1.unzipJson)(feedData.data),
        };
    },
};
exports.feedUpdateDescription = [
    {
        displayName: 'Feed ID',
        name: 'id',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['update'],
            },
        },
        default: '',
        description: 'ID of the feed to update',
    },
    {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['update'],
            },
        },
        default: '',
        description: 'Name of the feed',
    },
    {
        displayName: 'Language',
        name: 'lang',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['update'],
            },
        },
        default: '',
        description: 'Language (locale) for the feed, e.g. "en"',
    },
    {
        displayName: 'Data',
        name: 'data',
        type: 'json',
        required: true,
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['update'],
            },
        },
        default: '{}',
        description: 'Feed data as JSON. Sent to the API as N8nFeedUpdateInput data.',
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['update'],
            },
        },
        default: {},
        options: [
            {
                displayName: 'Looping',
                name: 'looping',
                type: 'number',
                typeOptions: {
                    minValue: 0,
                },
                default: 0,
                description: 'Optional number of loops for the feed. Leave at 0 to keep the current value.',
            },
        ],
    },
];
//# sourceMappingURL=update.js.map