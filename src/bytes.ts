import { allocUnique } from "./alloc.js";

/**
 * An array of bytes.
 */
export type Bytes = ArrayBufferLike | Uint8Array;

/**
 * Get the specified bytes as an uint 8 array.
 */
export function asUint8Array(bytes: Bytes): Uint8Array {
	return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
}

/**
 * Get the specified bytes as a data view.
 */
export function asDataView(bytes: Bytes): DataView {
	return bytes instanceof Uint8Array
		? new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
		: new DataView(bytes);
}

/**
 * Create a copy of the specified bytes.
 */
export function copyBytes(bytes: Bytes): ArrayBufferLike {
	return bytes instanceof Uint8Array
		? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
		: bytes.slice(0);
}

/**
 * Zero fill the specified buffer.
 */
export function zeroFillBuffer(buffer: ArrayBufferLike) {
	new Uint8Array(buffer).fill(0);
}

/**
 * Test if two byte arrays are equal.
 *
 * @returns True if the specified arrays are equal.
 */
export function bytesEqual(a: Bytes, b: Bytes): boolean {
	if (a === b) {
		return true;
	}
	if (a.byteLength !== b.byteLength) {
		return false;
	}
	const arrayA = asUint8Array(a);
	const arrayB = asUint8Array(b);
	for (let i = 0; i < arrayA.byteLength; i++) {
		if (arrayA[i] !== arrayB[i]) {
			return false;
		}
	}
	return true;
}

/**
 * Compare two byte arrays lexically.
 *
 * @returns -1 if a is smaller then b, 0 if a is equal to b and 1 if a is greater than b.
 */
export function lexicalCompareBytes(a: Bytes, b: Bytes): number {
	const arrayA = asUint8Array(a);
	const arrayB = asUint8Array(b);
	for (let i = 0; i < arrayA.byteLength; i++) {
		if (arrayA[i] > arrayB[i]) {
			return 1;
		} else if (arrayA[i] < arrayB[i]) {
			return -1;
		}
	}
	return arrayA.byteLength > arrayB.byteLength ? 1 : (arrayA.byteLength < arrayB.byteLength ? -1 : 0);
}

/**
 * Concat multiple byte arrays.
 */
export function concatBytes(chunks: Bytes[], chunksByteLength?: number): Uint8Array {
	if (chunksByteLength === undefined) {
		chunksByteLength = 0;
		for (let i = 0; i < chunks.length; i++) {
			chunksByteLength += chunks[i].byteLength;
		}
	}
	const array = new Uint8Array(allocUnique(chunksByteLength));
	for (let i = 0, o = 0; i < chunks.length; i++) {
		const chunk = asUint8Array(chunks[i]);
		array.set(chunk, o);
		o += chunk.byteLength;
	}
	return array;
}
