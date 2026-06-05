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
	...wizardGetByIdDescription,
	...wizardListDescription,
];
