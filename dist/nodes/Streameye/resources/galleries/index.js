"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.galleryDescription = exports.galleryOperations = void 0;
const listAssets_1 = require("./listAssets");
exports.galleryOperations = {
    listGalleryAssets: listAssets_1.galleryListAssetsOperation,
};
exports.galleryDescription = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['galleries'],
            },
        },
        options: [
            {
                name: 'Get Many',
                value: 'listGalleryAssets',
                action: 'Get gallery assets',
                description: 'Get gallery assets',
            },
        ],
        default: 'listGalleryAssets',
    },
    ...listAssets_1.galleryListAssetsDescription,
];
//# sourceMappingURL=index.js.map