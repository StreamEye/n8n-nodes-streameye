"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedGetByIdDescription = exports.feedGetByIdOperation = void 0;
const compression_1 = require("../../helpers/compression");
exports.feedGetByIdOperation = {
    responseKey: 'n8nGetFeedById',
    query: `query StreameyeFeedGetById($id: String!) {
		n8nGetFeedById(id: $id) {
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
    getVariables: (executeFunctions, itemIndex) => ({
        id: executeFunctions.getNodeParameter('id', itemIndex),
    }),
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
exports.feedGetByIdDescription = [
    {
        displayName: 'Feed ID',
        name: 'id',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['getById'],
            },
        },
        default: '',
        description: 'ID of the feed to retrieve',
    },
];
//# sourceMappingURL=getById.js.map