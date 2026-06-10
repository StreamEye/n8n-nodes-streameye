"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Streameye = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const skipItemError_1 = require("./helpers/skipItemError");
const types_1 = require("./resources/types");
const feeds_1 = require("./resources/feeds");
const galleries_1 = require("./resources/galleries");
const wizards_1 = require("./resources/wizards");
const getResourceOperation = (resource, operation) => {
    const resourceOperations = {
        feeds: feeds_1.feedOperations,
        galleries: galleries_1.galleryOperations,
        wizards: wizards_1.wizardOperations,
    };
    return resourceOperations[resource][operation];
};
const parseJsonParameter = (node, value, parameterName) => {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    if (typeof value !== 'string') {
        return value;
    }
    try {
        return JSON.parse(value);
    }
    catch {
        throw new n8n_workflow_1.NodeOperationError(node, `${parameterName} must be valid JSON`);
    }
};
const normalizeApiResult = (result) => {
    if (result === null || result === undefined) {
        return [{ json: {} }];
    }
    if (typeof result === 'string') {
        try {
            const parsed = JSON.parse(result);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => ({ json: item }));
            }
            return [{ json: parsed }];
        }
        catch {
            return [{ json: { value: result } }];
        }
    }
    if (Array.isArray(result)) {
        return result.map((item) => ({ json: item }));
    }
    if (result !== null &&
        typeof result === 'object' &&
        'items' in result &&
        Array.isArray(result.items)) {
        return result.items.map((item) => ({ json: item }));
    }
    return [{ json: result }];
};
class Streameye {
    constructor() {
        this.description = {
            displayName: 'Streameye',
            name: 'streameye',
            icon: { light: 'file:streameye.svg', dark: 'file:streameye.dark.svg' },
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Interact with the Streameye API',
            defaults: {
                name: 'Streameye',
            },
            usableAsTool: undefined,
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            credentials: [{ name: 'streameyeOAuth2Api', required: true }],
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Feed',
                            value: 'feeds',
                        },
                        {
                            name: 'Gallery',
                            value: 'galleries',
                        },
                        {
                            name: 'Wizard',
                            value: 'wizards',
                        },
                    ],
                    default: 'wizards',
                },
                ...feeds_1.feedDescription,
                ...galleries_1.galleryDescription,
                ...wizards_1.wizardDescription,
            ],
        };
    }
    async execute() {
        var _a;
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('streameyeOAuth2Api');
        const apiUrl = credentials.apiUrl;
        if (!apiUrl) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Streameye API URL is required');
        }
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const resource = this.getNodeParameter('resource', itemIndex);
                const operation = this.getNodeParameter('operation', itemIndex);
                const resourceOperation = getResourceOperation(resource, operation);
                const jsonParser = (value, parameterName) => parseJsonParameter(this.getNode(), value, parameterName);
                let validatedData;
                if ((0, types_1.isValidatedOperation)(resourceOperation)) {
                    const makeRequest = async (query, variables) => {
                        const res = await this.helpers.httpRequestWithAuthentication.call(this, 'streameyeOAuth2Api', {
                            method: 'POST',
                            url: apiUrl,
                            body: { query, variables },
                            json: true,
                        });
                        return res;
                    };
                    validatedData = await resourceOperation.validate(this, itemIndex, makeRequest, jsonParser);
                }
                const variables = await resourceOperation.getVariables(this, itemIndex, jsonParser, validatedData);
                const result = await this.helpers.httpRequestWithAuthentication.call(this, 'streameyeOAuth2Api', {
                    method: 'POST',
                    url: apiUrl,
                    body: {
                        query: resourceOperation.query,
                        variables,
                    },
                    json: true,
                });
                const responseData = result;
                if (Array.isArray(responseData.errors)) {
                    throw new n8n_workflow_1.NodeApiError(this.getNode(), responseData, {
                        message: 'Streameye API error',
                        description: JSON.stringify(responseData.errors),
                        itemIndex,
                    });
                }
                const apiResult = (_a = responseData.data) === null || _a === void 0 ? void 0 : _a[resourceOperation.responseKey];
                const transformedResult = resourceOperation.transformResponse
                    ? await resourceOperation.transformResponse(apiResult)
                    : apiResult;
                returnData.push(...normalizeApiResult(transformedResult).map((output) => ({
                    ...output,
                    pairedItem: { item: itemIndex },
                })));
            }
            catch (error) {
                if (error instanceof skipItemError_1.SkipItemError) {
                    this.addExecutionHints({
                        message: error.message,
                        type: 'warning',
                        location: 'outputPane',
                    });
                    returnData.push({
                        json: {},
                        pairedItem: { item: itemIndex },
                    });
                    continue;
                }
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: error.message },
                        pairedItem: { item: itemIndex },
                    });
                    continue;
                }
                throw new n8n_workflow_1.NodeApiError(this.getNode(), error, { itemIndex });
            }
        }
        return [returnData];
    }
}
exports.Streameye = Streameye;
//# sourceMappingURL=Streameye.node.js.map