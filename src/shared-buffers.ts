
let _buffer: ArrayBuffer | undefined = undefined;

/**
 * Setup an internal shared buffer to avoid memory allocations if possible.
 *
 * @param byteLength The exact byte length to allocate or 0 to discard the shared buffer.
 */
export function setupSharedBuffer(byteLength: number): void {
	_buffer = byteLength === 0 ? undefined : new ArrayBuffer(byteLength);
}

/**
 * Get an array buffer for **immediate** use.
 *
 * **Note**, that this buffer may contain **sensitive data**. All functions using this buffer must ensure that only overwritten parts of the buffer are read and that no references to this buffer are exposed.
 *
 * @param minByteLength The minimum byte length.
 * @returns An array buffer that has at least the specified required byte length.
 */
export function getSharedBuffer(minByteLength: number): ArrayBuffer {
	return (_buffer !== undefined && _buffer.byteLength >= minByteLength)
		? _buffer
		: new ArrayBuffer(minByteLength);
}
