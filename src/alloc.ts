
export interface Allocator {
	/**
	 * Allocate an array buffer of at least the specified byte length for synchronous use.
	 *
	 * Subsequent calls may return the same buffer.
	 */
	alloc?(minByteLength: number): ArrayBuffer;

	/**
	 * Allocate an array buffer of the specified byte length.
	 */
	allocUnique?(byteLength: number): ArrayBuffer;

	/**
	 * Dispose this allocator.
	 */
	dispose?(): void;
}

let ALLOCATOR: Allocator | null = null;

/**
 * Allocate an array buffer of at least the specified byte length for synchronous use.
 *
 * Subsequent calls may return the same buffer.
 */
export function alloc(minByteLength: number): ArrayBuffer {
	return ALLOCATOR?.alloc?.(minByteLength) ?? new ArrayBuffer(minByteLength);
}

/**
 * Allocate an array buffer of the specified byte length.
 */
export function allocUnique(byteLength: number): ArrayBuffer {
	return ALLOCATOR?.allocUnique?.(byteLength) ?? new ArrayBuffer(byteLength);
}

/**
 * Set the global allocator.
 */
export function setGlobalAllocator(allocator: Allocator | null) {
	ALLOCATOR = allocator;
}

/**
 * Temporarily use and then dispose the specified allocator.
 */
export function withAllocator<T>(allocator: Allocator, fn: () => T) {
	const outer = ALLOCATOR;
	try {
		ALLOCATOR = allocator;
		return fn();
	} finally {
		allocator.dispose?.();
		ALLOCATOR = outer;
	}
}

/**
 * An allocator that returns a shared buffer or a new one if the requested byte length is larger.
 */
export class SharedBufferAllocator implements Allocator {
	buffer: ArrayBuffer;

	constructor(buffer: ArrayBuffer) {
		this.buffer = buffer;
	}

	alloc(minByteLength: number): ArrayBuffer {
		if (minByteLength > this.buffer.byteLength) {
			return new ArrayBuffer(minByteLength);
		}
		return this.buffer;
	}
}

function fillZeroes(buffer: ArrayBuffer) {
	new Uint8Array(buffer).fill(0);
}

/**
 * An allocator that always returns unique buffers. When disposed, all allocated buffers are zero filled.
 */
export class UniqueZeroingAllocator implements Allocator {
	#buffers: ArrayBuffer[] = [];

	alloc(minByteLength: number): ArrayBuffer {
		return this.allocUnique(minByteLength);
	}

	allocUnique(byteLength: number): ArrayBuffer {
		const buffer = new ArrayBuffer(byteLength);
		this.#buffers.push(buffer);
		return buffer;
	}

	dispose(): void {
		this.#buffers.forEach(fillZeroes);
		this.#buffers.length = 0;
	}
}
