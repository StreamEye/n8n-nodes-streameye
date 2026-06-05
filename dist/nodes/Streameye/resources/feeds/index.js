"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedDescription = exports.feedOperations = void 0;
const create_1 = require("./create");
const getById_1 = require("./getById");
const getFiles_1 = require("./getFiles");
const getImages_1 = require("./getImages");
const getPermalinks_1 = require("./getPermalinks");
const list_1 = require("./list");
const update_1 = require("./update");
exports.feedOperations = {
    create: create_1.feedCreateOperation,
    getById: getById_1.feedGetByIdOperation,
    getFiles: getFiles_1.feedGetFilesOperation,
    getImages: getImages_1.feedGetImagesOperation,
    getPermalinks: getPermalinks_1.feedGetPermalinksOperation,
    list: list_1.feedListOperation,
    update: update_1.feedUpdateOperation,
};
exports.feedDescription = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['feeds'],
            },
        },
        options: [
            {
                name: 'Create',
                value: 'create',
                action: 'Create feed',
                description: 'Create feed',
            },
            {
                name: 'Get by ID',
                value: 'getById',
                action: 'Get feed',
                description: 'Get feed',
            },
            {
                name: 'Get Files',
                value: 'getFiles',
                action: 'Get feed files',
                description: 'Download the generated files for a feed',
            },
            {
                name: 'Get Images',
                value: 'getImages',
                action: 'Get feed images',
                description: 'Get rendered images for a feed',
            },
            {
                name: 'Get Many',
                value: 'list',
                action: 'Get feeds',
                description: 'Get feeds',
            },
            {
                name: 'Get Permalinks',
                value: 'getPermalinks',
                action: 'Get feed permalinks',
                description: 'Get permalinks for a feed',
            },
            {
                name: 'Update',
                value: 'update',
                action: 'Update feed',
                description: 'Update feed',
            },
        ],
        default: 'list',
    },
    ...create_1.feedCreateDescription,
    ...getById_1.feedGetByIdDescription,
    ...getFiles_1.feedGetFilesDescription,
    ...getImages_1.feedGetImagesDescription,
    ...getPermalinks_1.feedGetPermalinksDescription,
    ...list_1.feedListDescription,
    ...update_1.feedUpdateDescription,
];
//# sourceMappingURL=index.js.map