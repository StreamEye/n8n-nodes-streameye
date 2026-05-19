import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { unzipJson } from '../../helpers/compression';
import type { ApiRequest, JsonParameterParser } from '../types';

const applyDefault = (
	target: IDataObject,
	fieldName: string,
	defaults: IDataObject | undefined,
	defaultedFields: string[],
	label: string = fieldName,
): unknown => {
	const val = target[fieldName];
	if (val !== undefined && val !== null && val !== '') return val;
	const def = defaults?.[fieldName];
	if (def !== undefined && def !== null && def !== '') {
		target[fieldName] = def;
		defaultedFields.push(label);
		return def;
	}
	return val;
};

const isPlainObject = (value: unknown): value is IDataObject =>
	!!value && typeof value === 'object' && !Array.isArray(value);

const isEmptyValue = (value: unknown): boolean =>
	value === undefined || value === null || value === '';

// Merge the wizard's default screen entries with the feed data's screen entries by screen name
// (`sn`). A screen the feed omits keeps its wizard default in full; a screen the feed supplies is
// deep-merged over the default so untouched fields of that screen keep their defaults.
const mergeScreensByName = (defaults: IDataObject[], provided: IDataObject[]): IDataObject[] => {
	const bySn = new Map<string, IDataObject>();
	const order: string[] = [];

	for (const screen of defaults) {
		if (isPlainObject(screen) && typeof screen.sn === 'string') {
			bySn.set(screen.sn, { ...screen });
			order.push(screen.sn);
		}
	}

	for (const screen of provided) {
		if (!isPlainObject(screen) || typeof screen.sn !== 'string') continue;
		const existing = bySn.get(screen.sn);
		if (existing) {
			bySn.set(screen.sn, mergeWizardDefaults(existing, screen));
		} else {
			bySn.set(screen.sn, { ...screen });
			order.push(screen.sn);
		}
	}

	return order.map((sn) => bySn.get(sn) as IDataObject);
};

// Deep-merge the wizard's init data (defaults) with the caller-provided feed data; provided values
// win. Nested objects merge recursively and the `screens` array is merged element-wise by `sn`,
// so a feed that supplies only some fields/screens still inherits every other default item. Empty
// provided values ("", null, undefined) are treated as "not provided" and keep the default.
const mergeWizardDefaults = (defaults: IDataObject, provided: IDataObject): IDataObject => {
	const out: IDataObject = { ...defaults };

	for (const [key, value] of Object.entries(provided)) {
		const base = out[key];
		if (key === 'screens' && Array.isArray(base) && Array.isArray(value)) {
			out[key] = mergeScreensByName(base as IDataObject[], value as IDataObject[]);
		} else if (isPlainObject(base) && isPlainObject(value)) {
			out[key] = mergeWizardDefaults(base, value);
		} else if (!isEmptyValue(value)) {
			out[key] = value;
		}
	}

	return out;
};

// --- Conditional schema support ------------------------------------------------------------------
// The wizard schema uses the keys `conditions` (condition driver fields), `groups` (conditional
// field groups), `fields` (top-level always-on fields) and `screens` (per-screen field lists).
// Each field descriptor is `{ name, type, required, values?, g?: galleryId, p?, f? }`. `groups` is
// keyed by a boolean condition string built from `conditions` field names (e.g.
// "banner_type === 'image' && hasCheltLogo === true"). Conditions are evaluated with a tiny,
// side-effect-free parser (no `eval`).

const IDENTIFIER_TOKEN = /^[A-Za-z_$][\w$]*$/;
const CONDITION_LITERALS = new Set(['true', 'false']);

const CONDITION_TOKEN = /===|!==|==|!=|&&|\|\||\(|\)|'[^']*'|"[^"]*"|[A-Za-z_$][\w$]*|\S/g;
const VALID_TOKEN = /^(===|!==|==|!=|&&|\|\||\(|\)|'[^']*'|"[^"]*"|[A-Za-z_$][\w$]*)$/;

const tokenizeCondition = (expr: string): string[] | null => {
	const tokens = expr.match(CONDITION_TOKEN);
	if (!tokens) return null;
	for (const token of tokens) {
		if (!VALID_TOKEN.test(token)) return null; // stray character -> bail (treated as inactive)
	}
	return tokens;
};

// Return current values for the `conditions` identifiers used in group conditions.
const buildConditionValues = (schema: IDataObject, merged: IDataObject): Record<string, unknown> => {
	const conditionFields = schema.conditions;
	const groups = schema.groups;
	if (!conditionFields || typeof conditionFields !== 'object' || Array.isArray(conditionFields)) {
		return {};
	}
	if (!groups || typeof groups !== 'object' || Array.isArray(groups)) return {};

	const tokens = new Set<string>();
	for (const condition of Object.keys(groups)) {
		for (const token of tokenizeCondition(condition) ?? []) {
			if (IDENTIFIER_TOKEN.test(token) && !CONDITION_LITERALS.has(token)) tokens.add(token);
		}
	}

	const fieldNames = Object.keys(conditionFields as IDataObject);
	const values: Record<string, unknown> = {};

	for (const token of tokens) {
		if (fieldNames.includes(token)) values[token] = merged[token];
	}
	return values;
};

function parsePrimary(tokens: string[], state: { i: number }, values: Record<string, unknown>): unknown {
	const token = tokens[state.i];
	if (token === undefined) throw new Error('unexpected end of condition');
	if (token === '(') {
		state.i += 1;
		const value = parseOr(tokens, state, values);
		if (tokens[state.i] !== ')') throw new Error('expected )');
		state.i += 1;
		return value;
	}
	state.i += 1;
	if (token === 'true') return true;
	if (token === 'false') return false;
	if (token[0] === "'" || token[0] === '"') return token.slice(1, -1);
	// identifier: must be a known condition value, otherwise the condition is undecidable -> bail.
	if (!Object.prototype.hasOwnProperty.call(values, token)) {
		throw new Error(`unmapped condition identifier "${token}"`);
	}
	return values[token];
}

function parseComparison(
	tokens: string[],
	state: { i: number },
	values: Record<string, unknown>,
): boolean {
	const left = parsePrimary(tokens, state, values);
	const op = tokens[state.i];
	if (op === '===' || op === '!==' || op === '==' || op === '!=') {
		state.i += 1;
		const right = parsePrimary(tokens, state, values);
		const equal = left === right;
		return op === '===' || op === '==' ? equal : !equal;
	}
	return Boolean(left);
}

function parseAnd(tokens: string[], state: { i: number }, values: Record<string, unknown>): boolean {
	let left = parseComparison(tokens, state, values);
	while (tokens[state.i] === '&&') {
		state.i += 1;
		const right = parseComparison(tokens, state, values);
		left = left && right;
	}
	return left;
}

function parseOr(tokens: string[], state: { i: number }, values: Record<string, unknown>): boolean {
	let left = parseAnd(tokens, state, values);
	while (tokens[state.i] === '||') {
		state.i += 1;
		const right = parseAnd(tokens, state, values);
		left = left || right;
	}
	return left;
}

// Evaluate a group condition. Returns false (group inactive) on any parse/mapping failure so that
// validation can only miss checks, never raise false errors.
const evaluateCondition = (expr: string, values: Record<string, unknown>): boolean => {
	const tokens = tokenizeCondition(expr);
	if (!tokens || tokens.length === 0) return false;
	const state = { i: 0 };
	try {
		const result = parseOr(tokens, state, values);
		return state.i === tokens.length ? result : false;
	} catch {
		return false;
	}
};

export const validateFeedData = async (
	schema: IDataObject,
	feedData: IDataObject,
	wizardInitData?: IDataObject,
): Promise<{ data: IDataObject; defaultedFields: string[] }> => {
	const merged: IDataObject = { ...feedData };
	const errors: string[] = [];
	const defaultedFields: string[] = [];

	// conditions — condition driver fields: { fieldName: [allowedValues] }. Each must be present (or
	// defaulted from the wizard) and, if a list of allowed values is given, hold one of them.
	if (schema.conditions && typeof schema.conditions === 'object' && !Array.isArray(schema.conditions)) {
		for (const [fieldName, allowed] of Object.entries(schema.conditions as IDataObject)) {
			const val = applyDefault(merged, fieldName, wizardInitData, defaultedFields);
			if (val === undefined || val === null || val === '') {
				errors.push(`conditions: missing value for field "${fieldName}"`);
			} else if (Array.isArray(allowed) && allowed.length > 0 && !(allowed as unknown[]).includes(val)) {
				errors.push(
					`conditions: "${fieldName}" must be one of ${JSON.stringify(allowed)} (got ${JSON.stringify(val)})`,
				);
			}
		}
	}

	// groups — conditional groups: { conditionExpr: [fieldDescriptors] }. Evaluate each condition
	// (using the resolved condition values) and, for active groups, fill every missing field from the
	// wizard's default data. A `required` field still empty after defaulting is an error.
	if (schema.groups && typeof schema.groups === 'object' && !Array.isArray(schema.groups)) {
		const conditionValues = buildConditionValues(schema, merged);
		for (const [condition, fields] of Object.entries(schema.groups as IDataObject)) {
			if (!Array.isArray(fields)) continue;
			if (!evaluateCondition(condition, conditionValues)) continue;
			for (const field of fields as IDataObject[]) {
				const fieldName = field.name as string | undefined;
				if (!fieldName) continue;
				const val = applyDefault(merged, fieldName, wizardInitData, defaultedFields);
				if (field.required && (val === undefined || val === null || val === '')) {
					errors.push(`required field "${fieldName}" is missing or empty`);
				}
			}
		}
	}

	// fields — top-level field descriptors: each `required` field must be present (or defaulted).
	if (Array.isArray(schema.fields)) {
		for (const field of schema.fields as IDataObject[]) {
			const fieldName = field.name as string | undefined;
			if (field.required && fieldName) {
				const val = applyDefault(merged, fieldName, wizardInitData, defaultedFields);
				if (val === undefined || val === null || val === '') {
					errors.push(`fields: required field "${fieldName}" is missing or empty`);
				}
			}
		}
	}

	// screens — per-screen field lists. The feed data carries a `screens` array of { sn, ...values }
	// objects. Validate each present screen entry against the matching screen definition's fields,
	// defaulting missing values from the wizard's matching default screen entry. Screen entries the
	// feed data omits are left alone so validation never raises errors for screens the user is not
	// editing.
	if (Array.isArray(schema.screens) && Array.isArray(merged.screens)) {
		const defaultScreens = Array.isArray(wizardInitData?.screens)
			? (wizardInitData.screens as IDataObject[])
			: [];
		for (const screenEntry of merged.screens as IDataObject[]) {
			if (!screenEntry || typeof screenEntry !== 'object' || Array.isArray(screenEntry)) continue;
			const sn = screenEntry.sn as string | undefined;
			const screenDef = (schema.screens as IDataObject[]).find((s) => s?.sn === sn);
			if (!screenDef || !Array.isArray(screenDef.fields)) continue;
			const screenDefaults = defaultScreens.find((d) => d?.sn === sn);
			for (const field of screenDef.fields as IDataObject[]) {
				const fieldName = field.name as string | undefined;
				if (!fieldName) continue;
				const val = applyDefault(
					screenEntry,
					fieldName,
					screenDefaults,
					defaultedFields,
					`${sn}.${fieldName}`,
				);
				if (field.required && (val === undefined || val === null || val === '')) {
					errors.push(`screen "${sn}": required field "${fieldName}" is missing or empty`);
				}
			}
		}
	}

	if (errors.length > 0) {
		throw new Error(`Feed data validation failed:\n${errors.join('\n')}`);
	}

	return { data: merged, defaultedFields };
};

export const loadWizard = async (
	makeRequest: ApiRequest,
	wid: string,
): Promise<{
	schema: IDataObject;
	wizardInitData: IDataObject | undefined;
	languages: string[] | undefined;
}> => {
	if (!wid || wid.trim() === '') {
		throw new Error('Validation failed: wid is required but was not provided');
	}

	const response = await makeRequest(
		`query StreameyeWizardGetById($id: String!) {
			n8nGetWizardById(id: $id) { schema data languages }
		}`,
		{ id: wid },
	);

	if (Array.isArray(response.errors) && response.errors.length > 0) {
		throw new Error(`Failed to load wizard schema: ${JSON.stringify(response.errors)}`);
	}

	const wizardData = (response.data as IDataObject)?.n8nGetWizardById as IDataObject | undefined;

	if (!wizardData) {
		throw new Error(`Wizard with ID "${wid}" not found`);
	}

	const schema = (await unzipJson(wizardData.schema as string)) as IDataObject;
	const wizardInitData = wizardData.data
		? ((await unzipJson(wizardData.data as string)) as IDataObject | undefined)
		: undefined;
	const languages = wizardData.languages as string[] | undefined;

	return { schema, wizardInitData, languages };
};

// Load the feed being updated: its wizard id and its current (decompressed) data. The existing data
// becomes the base for an update so fields the caller does not supply keep their current values
// rather than being reset to the wizard's defaults.
export const loadFeedForUpdate = async (
	makeRequest: ApiRequest,
	id: string,
): Promise<{ wid: string; existingData: IDataObject }> => {
	if (!id || id.trim() === '') {
		throw new Error('Validation failed: id is required but was not provided');
	}

	const response = await makeRequest(
		`query StreameyeFeedGetById($id: String!) {
			n8nGetFeedById(id: $id) { wid data }
		}`,
		{ id },
	);

	if (Array.isArray(response.errors) && response.errors.length > 0) {
		throw new Error(`Failed to load feed: ${JSON.stringify(response.errors)}`);
	}

	const feed = (response.data as IDataObject)?.n8nGetFeedById as IDataObject | undefined;

	if (!feed) {
		throw new Error(`Feed with ID "${id}" not found`);
	}

	const unzipped = feed.data ? await unzipJson(feed.data as string) : {};
	const existingData =
		unzipped && typeof unzipped === 'object' && !Array.isArray(unzipped)
			? (unzipped as IDataObject)
			: {};

	return { wid: feed.wid as string, existingData };
};

const ASSET_LOOKUP_QUERY = `query StreameyeResolveAssetPicker($filter: GalleryAssetFilterInput, $from: Int!, $size: Int!) {
	n8nListAssets(filter: $filter, from: $from, size: $size) {
		items {
			url
		}
	}
}`;

// Collect every asset_picker field defined anywhere in the wizard schema, mapping field name
// (`name`) to its galleryId (`g`). The schema nests field definitions differently per wizard
// (top-level fields, conditional groups, per-screen field lists), so traverse it recursively rather
// than assuming a fixed shape.
const collectAssetPickerGalleries = (node: unknown, acc: Map<string, string>): void => {
	if (Array.isArray(node)) {
		for (const entry of node) collectAssetPickerGalleries(entry, acc);
		return;
	}

	if (!node || typeof node !== 'object') return;

	const obj = node as IDataObject;
	if (
		obj.type === 'asset_picker' &&
		typeof obj.name === 'string' &&
		typeof obj.g === 'string' &&
		!acc.has(obj.name)
	) {
		acc.set(obj.name, obj.g);
	}

	for (const value of Object.values(obj)) collectAssetPickerGalleries(value, acc);
};

// Look up the first matching gallery asset URL by keyword, or undefined if there is no match.
const lookupAssetUrl = async (
	makeRequest: ApiRequest,
	galleryId: string,
	keyword: string,
): Promise<string | undefined> => {
	const response = await makeRequest(ASSET_LOOKUP_QUERY, {
		filter: { gid: galleryId, keyword },
		from: 0,
		size: 1,
	});

	if (Array.isArray(response.errors) && response.errors.length > 0) {
		throw new Error(`Failed to look up asset "${keyword}": ${JSON.stringify(response.errors)}`);
	}

	const result = (response.data as IDataObject)?.n8nListAssets as IDataObject | undefined;
	const items = result?.items as IDataObject[] | undefined;
	const url = items?.[0]?.url;

	return typeof url === 'string' && url !== '' ? url : undefined;
};

// Resolve asset_picker properties in the feed data: keep values that are already URLs, resolve
// keywords to a gallery asset URL (top match), and drop properties with no match so create/update
// falls back to the wizard's default value for that field. Asset pickers live both at the top level
// and inside per-screen entries (the feed data's `screens` array), so resolve both.
export const resolveAssetPickers = async (
	makeRequest: ApiRequest,
	schema: IDataObject,
	feedData: IDataObject,
): Promise<{ data: IDataObject; resolved: string[]; removed: string[] }> => {
	const galleries = new Map<string, string>();
	collectAssetPickerGalleries(schema, galleries);

	const data: IDataObject = { ...feedData };
	const resolved: string[] = [];
	const removed: string[] = [];

	// Resolve the asset_picker properties present on a single object in place, labelling each
	// resolved/removed field for the execution hint.
	const resolveInto = async (target: IDataObject, label: (name: string) => string): Promise<void> => {
		for (const [name, galleryId] of galleries) {
			if (!(name in target)) continue;

			const value = target[name];
			if (typeof value !== 'string' || value === '') continue;
			if (/^https?:\/\//i.test(value)) continue;

			const url = await lookupAssetUrl(makeRequest, galleryId, value);
			if (url) {
				target[name] = url;
				resolved.push(label(name));
			} else {
				delete target[name];
				removed.push(label(name));
			}
		}
	};

	await resolveInto(data, (name) => name);

	if (Array.isArray(data.screens)) {
		const screens = (data.screens as unknown[]).map((entry) =>
			entry && typeof entry === 'object' && !Array.isArray(entry) ? { ...(entry as IDataObject) } : entry,
		);
		data.screens = screens;
		for (const entry of screens) {
			if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
			const screenEntry = entry as IDataObject;
			const sn = screenEntry.sn;
			await resolveInto(screenEntry, (name) => (sn ? `${sn}.${name}` : name));
		}
	}

	return { data, resolved, removed };
};

export const validateFeedInput = async (
	executeFunctions: IExecuteFunctions,
	makeRequest: ApiRequest,
	wid: string,
	lang: string,
	rawData: unknown,
	parseJsonParameter: JsonParameterParser,
	existingData?: IDataObject,
): Promise<IDataObject> => {
	const { schema, wizardInitData, languages } = await loadWizard(makeRequest, wid);

	if (lang && Array.isArray(languages) && languages.length > 0 && !languages.includes(lang)) {
		throw new Error(
			`Language "${lang}" is not supported by this wizard. Supported languages: ${languages.join(', ')}`,
		);
	}

	const parsedData = parseJsonParameter(rawData, 'Data');
	const feedData = (Array.isArray(parsedData) ? parsedData[0] : parsedData ?? {}) as IDataObject;

	const {
		data: resolvedData,
		resolved: resolvedAssets,
		removed: removedAssets,
	} = await resolveAssetPickers(makeRequest, schema, feedData);

	// On update, layer the supplied fields over the feed's existing data so unspecified fields keep
	// their current values; wizard defaults then only fill fields absent from both (genuinely new).
	// On create, deep-merge the supplied fields over the wizard's init data so a feed that omits
	// fields/screens (e.g. an empty `{}`) inherits every default item the wizard provides.
	const baseData: IDataObject = existingData
		? { ...existingData, ...resolvedData }
		: wizardInitData
			? mergeWizardDefaults(wizardInitData, resolvedData)
			: resolvedData;

	if (!existingData && wizardInitData) {
		const seededKeys = Object.keys(baseData).filter((key) => isEmptyValue(resolvedData[key]));
		if (seededKeys.length > 0) {
			executeFunctions.addExecutionHints({
				message: `Feed data merged with wizard defaults for: ${seededKeys.join(', ')}`,
				type: 'info',
				location: 'outputPane',
			});
		}
	}

	if (resolvedAssets.length > 0 || removedAssets.length > 0) {
		const parts: string[] = [];
		if (resolvedAssets.length > 0) {
			parts.push(`resolved to gallery URLs: ${resolvedAssets.join(', ')}`);
		}
		if (removedAssets.length > 0) {
			parts.push(`no asset match, falling back to wizard default: ${removedAssets.join(', ')}`);
		}
		executeFunctions.addExecutionHints({
			message: `Asset picker field(s) — ${parts.join('; ')}`,
			type: 'warning',
			location: 'outputPane',
		});
	}

	const { data, defaultedFields } = await validateFeedData(schema, baseData, wizardInitData);

	const uniqueDefaulted = [...new Set(defaultedFields)];
	if (uniqueDefaulted.length > 0) {
		executeFunctions.addExecutionHints({
			message: `Missing field(s) filled with wizard default values: ${uniqueDefaulted.join(', ')}`,
			type: 'warning',
			location: 'outputPane',
		});
	}

	return data;
};
