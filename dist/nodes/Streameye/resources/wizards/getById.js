"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wizardGetByIdDescription = exports.wizardGetByIdOperation = void 0;
const compression_1 = require("../../helpers/compression");
exports.wizardGetByIdOperation = {
    responseKey: 'n8nGetWizardById',
    query: `query StreameyeWizardGetById($id: String!) {
		n8nGetWizardById(id: $id) {
			schema
			data
			languages
			galleries
		}
	}`,
    getVariables: (executeFunctions, itemIndex) => ({
        id: executeFunctions.getNodeParameter('id', itemIndex),
    }),
    transformResponse: async (response) => {
        var _a, _b;
        const wizardStepData = response;
        if (!wizardStepData) {
            return response;
        }
        return {
            ...wizardStepData,
            schema: await (0, compression_1.unzipJson)(wizardStepData.schema),
            data: await (0, compression_1.unzipJson)(wizardStepData.data),
            languages: (_a = wizardStepData.languages) !== null && _a !== void 0 ? _a : [],
            galleries: (_b = wizardStepData.galleries) !== null && _b !== void 0 ? _b : [],
        };
    },
};
exports.wizardGetByIdDescription = [
    {
        displayName: 'Wizard ID',
        name: 'id',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['wizards'],
                operation: ['getById'],
            },
        },
        default: '',
        description: 'ID of the wizard to retrieve',
    },
];
//# sourceMappingURL=getById.js.map