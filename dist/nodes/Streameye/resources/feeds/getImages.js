"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedGetImagesDescription = exports.feedGetImagesOperation = void 0;
const inputHelpers_1 = require("../../helpers/inputHelpers");
const skipItemError_1 = require("../../helpers/skipItemError");
exports.feedGetImagesOperation = {
    responseKey: 'n8nGetImages',
    query: `mutation StreameyeFeedGetImages($id: String!, $quality: Int, $type: String) {
		n8nGetImages(id: $id, quality: $quality, type: $type)
	}`,
    getVariables: (executeFunctions, itemIndex) => {
        var _a, _b;
        const incoming = (_b = (_a = executeFunctions.getInputData()[itemIndex]) === null || _a === void 0 ? void 0 : _a.json) !== null && _b !== void 0 ? _b : {};
        if (incoming.type === 'html5') {
            throw new skipItemError_1.SkipItemError('Get Images is not supported for html5 feeds — item skipped');
        }
        return (0, inputHelpers_1.compactObject)({
            id: executeFunctions.getNodeParameter('id', itemIndex),
            quality: executeFunctions.getNodeParameter('quality', itemIndex, 93),
            type: executeFunctions.getNodeParameter('type', itemIndex, 'jpg'),
        });
    },
};
exports.feedGetImagesDescription = [
    {
        displayName: 'Feed ID',
        name: 'id',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['getImages'],
            },
        },
        default: '',
        description: 'ID of the feed to get images for',
    },
    {
        displayName: 'Quality',
        name: 'quality',
        type: 'number',
        typeOptions: {
            minValue: 0,
        },
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['getImages'],
            },
        },
        default: 93,
        description: 'Image quality',
    },
    {
        displayName: 'Type',
        name: 'type',
        type: 'options',
        options: [
            {
                name: 'JPG',
                value: 'jpg',
            },
            {
                name: 'PNG',
                value: 'png',
            },
            {
                name: 'WEBP',
                value: 'webp',
            },
        ],
        displayOptions: {
            show: {
                resource: ['feeds'],
                operation: ['getImages'],
            },
        },
        default: 'jpg',
        description: 'Image type',
    },
];
//# sourceMappingURL=getImages.js.map