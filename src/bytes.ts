
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

/**
 * Check if the specified bytes are equal in length and content.
 *
 * This is **not** a constant time comparison.
 */
export function bytesEqual(a: Bytes, b: Bytes): boolean {
	a = asUint8Array(a);
	b = asUint8Array(b);
	if (a.byteLength !== b.byteLength) {
		return false;
	}
	for (let i = 0; i < a.byteLength; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}
