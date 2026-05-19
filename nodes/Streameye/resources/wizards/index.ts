import type { INodeProperties } from 'n8n-workflow';
import type { ResourceOperation } from '../types';
import { wizardGetByIdDescription, wizardGetByIdOperation } from './getById';
import { wizardListDescription, wizardListOperation } from './list';

export type WizardOperation = 'getById' | 'list';

export const wizardOperations = {
	getById: wizardGetByIdOperation,
	list: wizardListOperation,
} satisfies Record<WizardOperation, ResourceOperation>;

export const wizardDescription: INodeProperties[] = [
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
				name: 'Get by ID',
				value: 'getById',
				action: 'Get a wizard by ID',
				description: 'Get a wizard by ID',
			},
			{
				name: 'List',
				value: 'list',
				action: 'List wizards',
				description: 'List wizards',
			},
		],
		default: 'list',
	},
	...wizardGetByIdDescription,
	...wizardListDescription,
];
