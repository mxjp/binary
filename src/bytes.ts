
export type Bytes = ArrayBuffer | Uint8Array<ArrayBuffer>;

export function asUint8Array(value: Bytes): Uint8Array<ArrayBuffer> {
	if (isArrayBuffer(value)) {
		return new Uint8Array(value);
	} else if (isUint8Array(value)) {
		return value;
	} else {
		throw new TypeError();
	}
}

/**
 * Check if the specified value is exactly an {@link ArrayBuffer `ArrayBuffer`}.
 */
export function isArrayBuffer(value: unknown): value is ArrayBuffer {
	return value instanceof ArrayBuffer && value.constructor === ArrayBuffer;
}

/**
 * Check if the specified value is exactly a {@link Uint8Array `Uint8Array<ArrayBuffer>`}.
 */
export function isUint8Array(value: unknown): value is Uint8Array<ArrayBuffer> {
	return value instanceof Uint8Array && value.constructor === Uint8Array && isArrayBuffer(value.buffer);
}
