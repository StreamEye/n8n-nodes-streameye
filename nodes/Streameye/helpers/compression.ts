type CompressionFormat = 'gzip';

type CompressionStreamConstructor = new (format: CompressionFormat) => {
	writable: WritableStream<Uint8Array>;
	readable: ReadableStream<Uint8Array>;
};

declare const CompressionStream: CompressionStreamConstructor;
declare const DecompressionStream: CompressionStreamConstructor;

const streamToUint8Array = async (stream: ReadableStream<Uint8Array>): Promise<Uint8Array> => {
	const chunks: Uint8Array[] = [];
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

const compress = async (data: Uint8Array): Promise<Uint8Array> => {
	const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'));

	return await streamToUint8Array(stream);
};

const decompress = async (data: Uint8Array): Promise<Uint8Array> => {
	const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'));

	return await streamToUint8Array(stream);
};

const parseJsonValue = (value: string): unknown => {
	let parsed: unknown = value;

	while (typeof parsed === 'string') {
		const trimmedValue = parsed.trim();

		if (!trimmedValue) {
			return {};
		}

		try {
			parsed = JSON.parse(trimmedValue) as unknown;
		} catch {
			return parsed;
		}
	}

	return parsed;
};

export const unzipJson = async (data: string | Uint8Array): Promise<unknown> => {
	if (!data) {
		return {};
	}

	try {
		const compressed = typeof data === 'string' ? Buffer.from(data, 'base64') : Buffer.from(data);
		const json = new TextDecoder().decode(await decompress(compressed));

		return parseJsonValue(json);
	} catch {
		return typeof data === 'string' ? parseJsonValue(data) : {};
	}
};

export const zipJson = async (data: unknown): Promise<string> => {
	if (!data) {
		return '';
	}

	try {
		const compressed = await compress(new TextEncoder().encode(JSON.stringify(data)));

		return Buffer.from(compressed).toString('base64');
	} catch {
		return '';
	}
};
