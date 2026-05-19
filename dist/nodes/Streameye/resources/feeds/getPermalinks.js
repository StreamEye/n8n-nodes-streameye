"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedGetPermalinksDescription = exports.feedGetPermalinksOperation = void 0;
const inputHelpers_1 = require("../../helpers/inputHelpers");
const skipItemError_1 = require("../../helpers/skipItemError");
exports.feedGetPermalinksOperation = {
    responseKey: 'n8nGetPermalinks',
    query: `mutation StreameyeFeedGetPermalinks($id: String!) {
		n8nGetPermalinks(id: $id)
	}`,
    getVariables: (executeFunctions, itemIndex) => {
        var _a, _b;
        const incoming = (_b = (_a = executeFunctions.getInputData()[itemIndex]) === null || _a === void 0 ? void 0 : _a.json) !== null && _b !== void 0 ? _b : {};
        if (incoming.type === 'html5') {
            throw new skipItemError_1.SkipItemError('Get Permalinks is not supported for html5 feeds — item skipped');
        }
        return (0, inputHelpers_1.compactObject)({
            id: executeFunctions.getNodeParameter('id', itemIndex),
        });
    },
};
exports.feedGetPermalinksDescription = [
    {
        displayName: 'Feed ID',
        name: 'id',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['getPermalinks'],
            },
        },
        default: '',
        description: 'ID of the feed to get permalinks for',
    },
];
//# sourceMappingURL=getPermalinks.js.map