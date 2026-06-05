import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INode,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';

import { SkipItemError } from './helpers/skipItemError';
import { isValidatedOperation } from './resources/types';
import type { ApiRequest, ResourceOperation } from './resources/types';
import { feedDescription, feedOperations } from './resources/feeds';
import { galleryDescription, galleryOperations } from './resources/galleries';
import { wizardDescription, wizardOperations } from './resources/wizards';

type StreameyeResource = 'feeds' | 'galleries' | 'wizards';

const getResourceOperation = (
	resource: StreameyeResource,
	operation: string,
): ResourceOperation => {
	const resourceOperations = {
		feeds: feedOperations,
		galleries: galleryOperations,
		wizards: wizardOperations,
	} as Record<StreameyeResource, Record<string, ResourceOperation>>;

	return resourceOperations[resource][operation];
};

const parseJsonParameter = (
	node: INode,
	value: unknown,
	parameterName: string,
): IDataObject | IDataObject[] | undefined => {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}

	if (typeof value !== 'string') {
		return value as IDataObject | IDataObject[];
	}

	try {
		return JSON.parse(value) as IDataObject | IDataObject[];
	} catch {
		throw new NodeOperationError(node, `${parameterName} must be valid JSON`);
	}
};

const normalizeApiResult = (result: unknown): INodeExecutionData[] => {
	if (result === null || result === undefined) {
		return [{ json: {} }];
	}

	if (typeof result === 'string') {
		try {
			const parsed = JSON.parse(result) as unknown;

			if (Array.isArray(parsed)) {
				return parsed.map((item) => ({ json: item as IDataObject }));
			}

			return [{ json: parsed as IDataObject }];
		} catch {
			return [{ json: { value: result } }];
		}
	}

	if (Array.isArray(result)) {
		return result.map((item) => ({ json: item as IDataObject }));
	}

	if (
		result !== null &&
		typeof result === 'object' &&
		'items' in result &&
		Array.isArray((result as IDataObject).items)
	) {
		return ((result as IDataObject).items as IDataObject[]).map((item) => ({ json: item }));
	}

	return [{ json: result as IDataObject }];
};

export class Streameye implements INodeType {
	description: INodeTypeDescription = {
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
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
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
			...feedDescription,
			...galleryDescription,
			...wizardDescription,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('streameyeOAuth2Api');
		const apiUrl = credentials.apiUrl as string;

		if (!apiUrl) {
			throw new NodeOperationError(this.getNode(), 'Streameye API URL is required');
		}

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as StreameyeResource;
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const resourceOperation = getResourceOperation(resource, operation);

				const jsonParser = (value: unknown, parameterName: string) =>
					parseJsonParameter(this.getNode(), value, parameterName);

				let validatedData: IDataObject | undefined;
				if (isValidatedOperation(resourceOperation)) {
					const makeRequest: ApiRequest = async (query, variables) => {
						const res = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'streameyeOAuth2Api',
							{
								method: 'POST',
								url: apiUrl,
								body: { query, variables },
								json: true,
							} as IHttpRequestOptions,
						);
						return res as IDataObject;
					};
					validatedData = await resourceOperation.validate(this, itemIndex, makeRequest, jsonParser);
				}

				const variables = await resourceOperation.getVariables(this, itemIndex, jsonParser, validatedData);

				if (resource === 'feeds' && (operation === 'create' || operation === 'update')) {
					this.logger.info(
						`Streameye feed ${operation} → GraphQL request\nquery: ${resourceOperation.query}\nvariables: ${JSON.stringify(variables, null, 2)}`,
					);
				}

				const result = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'streameyeOAuth2Api',
					{
						method: 'POST',
						url: apiUrl,
						body: {
							query: resourceOperation.query,
							variables,
						},
						json: true,
					} as IHttpRequestOptions,
				);

				const responseData = result as IDataObject;
				if (Array.isArray(responseData.errors)) {
					throw new NodeApiError(this.getNode(), responseData as unknown as JsonObject, {
						message: 'Streameye API error',
						description: JSON.stringify(responseData.errors),
						itemIndex,
					});
				}

				const apiResult = (responseData.data as IDataObject)?.[resourceOperation.responseKey];
				const transformedResult = resourceOperation.transformResponse
					? await resourceOperation.transformResponse(apiResult)
					: apiResult;

				returnData.push(
					...normalizeApiResult(transformedResult).map((output) => ({
						...output,
						pairedItem: { item: itemIndex },
					})),
				);
			} catch (error) {
				if (error instanceof SkipItemError) {
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
						json: { error: (error as Error).message },
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
			}
		}

		return [returnData];
	}
}
