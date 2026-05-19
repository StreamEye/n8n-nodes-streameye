"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zipJson = exports.unzipJson = void 0;
const streamToUint8Array = async (stream) => {
    const chunks = [];
    const reader = stream.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        if (value) {
            chunks.push(value);
        }
    }
    const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
    const result = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
};
const compress = async (data) => {
    const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'));
    return await streamToUint8Array(stream);
};
const decompress = async (data) => {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await streamToUint8Array(stream);
};
const parseJsonValue = (value) => {
    let parsed = value;
    while (typeof parsed === 'string') {
        const trimmedValue = parsed.trim();
        if (!trimmedValue) {
            return {};
        }
        try {
            parsed = JSON.parse(trimmedValue);
        }
        catch {
            return parsed;
        }
    }
    return parsed;
};
const unzipJson = async (data) => {
    if (!data) {
        return {};
    }
    try {
        const compressed = typeof data === 'string' ? Buffer.from(data, 'base64') : Buffer.from(data);
        const json = new TextDecoder().decode(await decompress(compressed));
        return parseJsonValue(json);
    }
    catch {
        return typeof data === 'string' ? parseJsonValue(data) : {};
    }
};
exports.unzipJson = unzipJson;
const zipJson = async (data) => {
    if (!data) {
        return '';
    }
    try {
        const compressed = await compress(new TextEncoder().encode(JSON.stringify(data)));
        return Buffer.from(compressed).toString('base64');
    }
    catch {
        return '';
    }
};
exports.zipJson = zipJson;
//# sourceMappingURL=compression.js.map