"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedCreateDescription = exports.feedCreateOperation = void 0;
const compression_1 = require("../../helpers/compression");
const inputHelpers_1 = require("../../helpers/inputHelpers");
const validateFeedData_1 = require("./validateFeedData");
exports.feedCreateOperation = {
    responseKey: 'n8nCreateFeed',
    query: `mutation StreameyeFeedCreate($input: N8nFeedCreateInput!) {
		n8nCreateFeed(input: $input) {
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
        const wid = executeFunctions.getNodeParameter('wid', itemIndex);
        const lang = executeFunctions.getNodeParameter('lang', itemIndex);
        const rawData = executeFunctions.getNodeParameter('data', itemIndex);
        return await (0, validateFeedData_1.validateFeedInput)(executeFunctions, makeRequest, wid, lang, rawData, parseJsonParameter);
    },
    getVariables: async (executeFunctions, itemIndex, parseJsonParameter, validatedData) => {
        var _a;
        const additionalFields = executeFunctions.getNodeParameter('additionalFields', itemIndex, {});
        const looping = (_a = additionalFields.looping) !== null && _a !== void 0 ? _a : 2;
        const dataObj = validatedData !== null && validatedData !== void 0 ? validatedData : (() => {
            const raw = executeFunctions.getNodeParameter('data', itemIndex);
            const parsed = parseJsonParameter(raw, 'Data');
            if (parsed === undefined)
                throw new Error('Data is required');
            return Array.isArray(parsed) ? parsed[0] : parsed;
        })();
        return (0, inputHelpers_1.compactObject)({
            input: (0, inputHelpers_1.compactObject)({
                wid: executeFunctions.getNodeParameter('wid', itemIndex),
                name: executeFunctions.getNodeParameter('name', itemIndex),
                lang: executeFunctions.getNodeParameter('lang', itemIndex),
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
exports.feedCreateDescription = [
    {
        displayName: 'Wizard ID',
        name: 'wid',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['create'],
            },
        },
        default: '',
        description: 'ID of the wizard to create the feed from',
    },
    {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['create'],
            },
        },
        default: '',
        description: 'Name of the feed',
    },
    {
        displayName: 'Language',
        name: 'lang',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['create'],
            },
        },
        default: 'en',
        description: 'Language (locale) for the feed, e.g. "en". Must be a language supported by the wizard.',
    },
    {
        displayName: 'Data',
        name: 'data',
        type: 'json',
        required: true,
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['create'],
            },
        },
        default: '{}',
        description: 'Feed data as JSON. Sent to the API as the N8nFeedCreateInput data string.',
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['create'],
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
                default: 2,
                description: 'Optional number of loops for the feed. Defaults to 2.',
            },
        ],
    },
];
//# sourceMappingURL=create.js.map