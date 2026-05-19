"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedGetFilesDescription = exports.feedGetFilesOperation = void 0;
const inputHelpers_1 = require("../../helpers/inputHelpers");
exports.feedGetFilesOperation = {
    responseKey: 'n8nDownloadFeedFiles',
    query: `query StreameyeFeedGetFiles($id: String!) {
		n8nDownloadFeedFiles(id: $id)
	}`,
    getVariables: (executeFunctions, itemIndex) => {
        return (0, inputHelpers_1.compactObject)({
            id: executeFunctions.getNodeParameter('id', itemIndex),
        });
    },
};
exports.feedGetFilesDescription = [
    {
        displayName: 'Feed ID',
        name: 'id',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['getFiles'],
            },
        },
        default: '',
        description: 'ID of the feed to download files for',
    },
];
//# sourceMappingURL=getFiles.js.map