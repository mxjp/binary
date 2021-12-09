
let _buffer: ArrayBuffer | undefined = undefined;

/**
 * Setup a thread global shared buffer to avoid memory allocations if possible.
 *
 * @param byteLength The byte length to allocate or 0 to discard the current buffer.
 */
export function setupSyncSharedBuffer(byteLength: number): void {
	_buffer = byteLength === 0 ? undefined : new ArrayBuffer(byteLength);
}

/**
 * Get a thread global shared buffer or allocate memory.
 *
 * @param requireByteLength The minimum byte length.
 * @returns An array buffer that has at least the specified required byte length.
 */
export function getSyncSharedBuffer(requireByteLength: number): ArrayBuffer {
	return (_buffer !== undefined && _buffer.byteLength >= requireByteLength)
		? _buffer
		: new ArrayBuffer(requireByteLength);
}
