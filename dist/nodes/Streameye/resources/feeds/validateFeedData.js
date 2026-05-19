"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeedInput = exports.resolveAssetPickers = exports.loadFeedForUpdate = exports.loadWizard = exports.validateFeedData = void 0;
const compression_1 = require("../../helpers/compression");
const applyDefault = (target, fieldName, defaults, defaultedFields, label = fieldName) => {
    const val = target[fieldName];
    if (val !== undefined && val !== null && val !== '')
        return val;
    const def = defaults === null || defaults === void 0 ? void 0 : defaults[fieldName];
    if (def !== undefined && def !== null && def !== '') {
        target[fieldName] = def;
        defaultedFields.push(label);
        return def;
    }
    return val;
};
const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const isEmptyValue = (value) => value === undefined || value === null || value === '';
const mergeScreensByName = (defaults, provided) => {
    const bySn = new Map();
    const order = [];
    for (const screen of defaults) {
        if (isPlainObject(screen) && typeof screen.sn === 'string') {
            bySn.set(screen.sn, { ...screen });
            order.push(screen.sn);
        }
    }
    for (const screen of provided) {
        if (!isPlainObject(screen) || typeof screen.sn !== 'string')
            continue;
        const existing = bySn.get(screen.sn);
        if (existing) {
            bySn.set(screen.sn, mergeWizardDefaults(existing, screen));
        }
        else {
            bySn.set(screen.sn, { ...screen });
            order.push(screen.sn);
        }
    }
    return order.map((sn) => bySn.get(sn));
};
const mergeWizardDefaults = (defaults, provided) => {
    const out = { ...defaults };
    for (const [key, value] of Object.entries(provided)) {
        const base = out[key];
        if (key === 'screens' && Array.isArray(base) && Array.isArray(value)) {
            out[key] = mergeScreensByName(base, value);
        }
        else if (isPlainObject(base) && isPlainObject(value)) {
            out[key] = mergeWizardDefaults(base, value);
        }
        else if (!isEmptyValue(value)) {
            out[key] = value;
        }
    }
    return out;
};
const IDENTIFIER_TOKEN = /^[A-Za-z_$][\w$]*$/;
const CONDITION_LITERALS = new Set(['true', 'false']);
const CONDITION_TOKEN = /===|!==|==|!=|&&|\|\||\(|\)|'[^']*'|"[^"]*"|[A-Za-z_$][\w$]*|\S/g;
const VALID_TOKEN = /^(===|!==|==|!=|&&|\|\||\(|\)|'[^']*'|"[^"]*"|[A-Za-z_$][\w$]*)$/;
const tokenizeCondition = (expr) => {
    const tokens = expr.match(CONDITION_TOKEN);
    if (!tokens)
        return null;
    for (const token of tokens) {
        if (!VALID_TOKEN.test(token))
            return null;
    }
    return tokens;
};
const buildConditionValues = (schema, merged) => {
    var _a;
    const conditionFields = schema.conditions;
    const groups = schema.groups;
    if (!conditionFields || typeof conditionFields !== 'object' || Array.isArray(conditionFields)) {
        return {};
    }
    if (!groups || typeof groups !== 'object' || Array.isArray(groups))
        return {};
    const tokens = new Set();
    for (const condition of Object.keys(groups)) {
        for (const token of (_a = tokenizeCondition(condition)) !== null && _a !== void 0 ? _a : []) {
            if (IDENTIFIER_TOKEN.test(token) && !CONDITION_LITERALS.has(token))
                tokens.add(token);
        }
    }
    const fieldNames = Object.keys(conditionFields);
    const values = {};
    for (const token of tokens) {
        if (fieldNames.includes(token))
            values[token] = merged[token];
    }
    return values;
};
function parsePrimary(tokens, state, values) {
    const token = tokens[state.i];
    if (token === undefined)
        throw new Error('unexpected end of condition');
    if (token === '(') {
        state.i += 1;
        const value = parseOr(tokens, state, values);
        if (tokens[state.i] !== ')')
            throw new Error('expected )');
        state.i += 1;
        return value;
    }
    state.i += 1;
    if (token === 'true')
        return true;
    if (token === 'false')
        return false;
    if (token[0] === "'" || token[0] === '"')
        return token.slice(1, -1);
    if (!Object.prototype.hasOwnProperty.call(values, token)) {
        throw new Error(`unmapped condition identifier "${token}"`);
    }
    return values[token];
}
function parseComparison(tokens, state, values) {
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
function parseAnd(tokens, state, values) {
    let left = parseComparison(tokens, state, values);
    while (tokens[state.i] === '&&') {
        state.i += 1;
        const right = parseComparison(tokens, state, values);
        left = left && right;
    }
    return left;
}
function parseOr(tokens, state, values) {
    let left = parseAnd(tokens, state, values);
    while (tokens[state.i] === '||') {
        state.i += 1;
        const right = parseAnd(tokens, state, values);
        left = left || right;
    }
    return left;
}
const evaluateCondition = (expr, values) => {
    const tokens = tokenizeCondition(expr);
    if (!tokens || tokens.length === 0)
        return false;
    const state = { i: 0 };
    try {
        const result = parseOr(tokens, state, values);
        return state.i === tokens.length ? result : false;
    }
    catch {
        return false;
    }
};
const validateFeedData = async (schema, feedData, wizardInitData) => {
    const merged = { ...feedData };
    const errors = [];
    const defaultedFields = [];
    if (schema.conditions && typeof schema.conditions === 'object' && !Array.isArray(schema.conditions)) {
        for (const [fieldName, allowed] of Object.entries(schema.conditions)) {
            const val = applyDefault(merged, fieldName, wizardInitData, defaultedFields);
            if (val === undefined || val === null || val === '') {
                errors.push(`conditions: missing value for field "${fieldName}"`);
            }
            else if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(val)) {
                errors.push(`conditions: "${fieldName}" must be one of ${JSON.stringify(allowed)} (got ${JSON.stringify(val)})`);
            }
        }
    }
    if (schema.groups && typeof schema.groups === 'object' && !Array.isArray(schema.groups)) {
        const conditionValues = buildConditionValues(schema, merged);
        for (const [condition, fields] of Object.entries(schema.groups)) {
            if (!Array.isArray(fields))
                continue;
            if (!evaluateCondition(condition, conditionValues))
                continue;
            for (const field of fields) {
                const fieldName = field.name;
                if (!fieldName)
                    continue;
                const val = applyDefault(merged, fieldName, wizardInitData, defaultedFields);
                if (field.required && (val === undefined || val === null || val === '')) {
                    errors.push(`required field "${fieldName}" is missing or empty`);
                }
            }
        }
    }
    if (Array.isArray(schema.fields)) {
        for (const field of schema.fields) {
            const fieldName = field.name;
            if (field.required && fieldName) {
                const val = applyDefault(merged, fieldName, wizardInitData, defaultedFields);
                if (val === undefined || val === null || val === '') {
                    errors.push(`fields: required field "${fieldName}" is missing or empty`);
                }
            }
        }
    }
    if (Array.isArray(schema.screens) && Array.isArray(merged.screens)) {
        const defaultScreens = Array.isArray(wizardInitData === null || wizardInitData === void 0 ? void 0 : wizardInitData.screens)
            ? wizardInitData.screens
            : [];
        for (const screenEntry of merged.screens) {
            if (!screenEntry || typeof screenEntry !== 'object' || Array.isArray(screenEntry))
                continue;
            const sn = screenEntry.sn;
            const screenDef = schema.screens.find((s) => (s === null || s === void 0 ? void 0 : s.sn) === sn);
            if (!screenDef || !Array.isArray(screenDef.fields))
                continue;
            const screenDefaults = defaultScreens.find((d) => (d === null || d === void 0 ? void 0 : d.sn) === sn);
            for (const field of screenDef.fields) {
                const fieldName = field.name;
                if (!fieldName)
                    continue;
                const val = applyDefault(screenEntry, fieldName, screenDefaults, defaultedFields, `${sn}.${fieldName}`);
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
exports.validateFeedData = validateFeedData;
const loadWizard = async (makeRequest, wid) => {
    var _a;
    if (!wid || wid.trim() === '') {
        throw new Error('Validation failed: wid is required but was not provided');
    }
    const response = await makeRequest(`query StreameyeWizardGetById($id: String!) {
			n8nGetWizardById(id: $id) { schema data languages }
		}`, { id: wid });
    if (Array.isArray(response.errors) && response.errors.length > 0) {
        throw new Error(`Failed to load wizard schema: ${JSON.stringify(response.errors)}`);
    }
    const wizardData = (_a = response.data) === null || _a === void 0 ? void 0 : _a.n8nGetWizardById;
    if (!wizardData) {
        throw new Error(`Wizard with ID "${wid}" not found`);
    }
    const schema = (await (0, compression_1.unzipJson)(wizardData.schema));
    const wizardInitData = wizardData.data
        ? (await (0, compression_1.unzipJson)(wizardData.data))
        : undefined;
    const languages = wizardData.languages;
    return { schema, wizardInitData, languages };
};
exports.loadWizard = loadWizard;
const loadFeedForUpdate = async (makeRequest, id) => {
    var _a;
    if (!id || id.trim() === '') {
        throw new Error('Validation failed: id is required but was not provided');
    }
    const response = await makeRequest(`query StreameyeFeedGetById($id: String!) {
			n8nGetFeedById(id: $id) { wid data }
		}`, { id });
    if (Array.isArray(response.errors) && response.errors.length > 0) {
        throw new Error(`Failed to load feed: ${JSON.stringify(response.errors)}`);
    }
    const feed = (_a = response.data) === null || _a === void 0 ? void 0 : _a.n8nGetFeedById;
    if (!feed) {
        throw new Error(`Feed with ID "${id}" not found`);
    }
    const unzipped = feed.data ? await (0, compression_1.unzipJson)(feed.data) : {};
    const existingData = unzipped && typeof unzipped === 'object' && !Array.isArray(unzipped)
        ? unzipped
        : {};
    return { wid: feed.wid, existingData };
};
exports.loadFeedForUpdate = loadFeedForUpdate;
const ASSET_LOOKUP_QUERY = `query StreameyeResolveAssetPicker($filter: GalleryAssetFilterInput, $from: Int!, $size: Int!) {
	n8nListAssets(filter: $filter, from: $from, size: $size) {
		items {
			url
		}
	}
}`;
const collectAssetPickerGalleries = (node, acc) => {
    if (Array.isArray(node)) {
        for (const entry of node)
            collectAssetPickerGalleries(entry, acc);
        return;
    }
    if (!node || typeof node !== 'object')
        return;
    const obj = node;
    if (obj.type === 'asset_picker' &&
        typeof obj.name === 'string' &&
        typeof obj.g === 'string' &&
        !acc.has(obj.name)) {
        acc.set(obj.name, obj.g);
    }
    for (const value of Object.values(obj))
        collectAssetPickerGalleries(value, acc);
};
const lookupAssetUrl = async (makeRequest, galleryId, keyword) => {
    var _a, _b;
    const response = await makeRequest(ASSET_LOOKUP_QUERY, {
        filter: { gid: galleryId, keyword },
        from: 0,
        size: 1,
    });
    if (Array.isArray(response.errors) && response.errors.length > 0) {
        throw new Error(`Failed to look up asset "${keyword}": ${JSON.stringify(response.errors)}`);
    }
    const result = (_a = response.data) === null || _a === void 0 ? void 0 : _a.n8nListAssets;
    const items = result === null || result === void 0 ? void 0 : result.items;
    const url = (_b = items === null || items === void 0 ? void 0 : items[0]) === null || _b === void 0 ? void 0 : _b.url;
    return typeof url === 'string' && url !== '' ? url : undefined;
};
const resolveAssetPickers = async (makeRequest, schema, feedData) => {
    const galleries = new Map();
    collectAssetPickerGalleries(schema, galleries);
    const data = { ...feedData };
    const resolved = [];
    const removed = [];
    const resolveInto = async (target, label) => {
        for (const [name, galleryId] of galleries) {
            if (!(name in target))
                continue;
            const value = target[name];
            if (typeof value !== 'string' || value === '')
                continue;
            if (/^https?:\/\//i.test(value))
                continue;
            const url = await lookupAssetUrl(makeRequest, galleryId, value);
            if (url) {
                target[name] = url;
                resolved.push(label(name));
            }
            else {
                delete target[name];
                removed.push(label(name));
            }
        }
    };
    await resolveInto(data, (name) => name);
    if (Array.isArray(data.screens)) {
        const screens = data.screens.map((entry) => entry && typeof entry === 'object' && !Array.isArray(entry) ? { ...entry } : entry);
        data.screens = screens;
        for (const entry of screens) {
            if (!entry || typeof entry !== 'object' || Array.isArray(entry))
                continue;
            const screenEntry = entry;
            const sn = screenEntry.sn;
            await resolveInto(screenEntry, (name) => (sn ? `${sn}.${name}` : name));
        }
    }
    return { data, resolved, removed };
};
exports.resolveAssetPickers = resolveAssetPickers;
const validateFeedInput = async (executeFunctions, makeRequest, wid, lang, rawData, parseJsonParameter, existingData) => {
    const { schema, wizardInitData, languages } = await (0, exports.loadWizard)(makeRequest, wid);
    if (lang && Array.isArray(languages) && languages.length > 0 && !languages.includes(lang)) {
        throw new Error(`Language "${lang}" is not supported by this wizard. Supported languages: ${languages.join(', ')}`);
    }
    const parsedData = parseJsonParameter(rawData, 'Data');
    const feedData = (Array.isArray(parsedData) ? parsedData[0] : parsedData !== null && parsedData !== void 0 ? parsedData : {});
    const { data: resolvedData, resolved: resolvedAssets, removed: removedAssets, } = await (0, exports.resolveAssetPickers)(makeRequest, schema, feedData);
    const baseData = existingData
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
        const parts = [];
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
    const { data, defaultedFields } = await (0, exports.validateFeedData)(schema, baseData, wizardInitData);
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
exports.validateFeedInput = validateFeedInput;
//# sourceMappingURL=validateFeedData.js.map