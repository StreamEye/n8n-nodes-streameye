"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wizardDescription = exports.wizardOperations = void 0;
const getById_1 = require("./getById");
const list_1 = require("./list");
exports.wizardOperations = {
    getById: getById_1.wizardGetByIdOperation,
    list: list_1.wizardListOperation,
};
exports.wizardDescription = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['wizards'],
            },
        },
        options: [
            {
                name: 'Get Many',
                value: 'list',
                action: 'Get wizards',
                description: 'Get wizards',
            },
            {
                name: 'Get by ID',
                value: 'getById',
                action: 'Get wizard',
                description: 'Get wizard',
            },
        ],
        default: 'list',
    },
    ...getById_1.wizardGetByIdDescription,
    ...list_1.wizardListDescription,
];
//# sourceMappingURL=index.js.map