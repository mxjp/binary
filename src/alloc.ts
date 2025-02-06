import { zeroFillBuffer } from "./bytes.js";

export interface Allocator {
	/**
	 * Allocate an array buffer of at least the specified byte length for immediaty synchronous use.
	 *
	 * Subsequent calls may return the same buffer.
	 */
	allocSync?(minByteLength: number): ArrayBuffer;

	/**
	 * Allocate an array buffer of the specified byte length.
	 */
	allocUnique?(byteLength: number): ArrayBuffer;
}

let ALLOCATOR: Allocator | null = null;

/**
 * Allocate an array buffer of at least the specified byte length for immediate synchronous use.
 *
 * Subsequent calls may return the same buffer.
 */
export function allocSync(minByteLength: number): ArrayBuffer {
	return ALLOCATOR?.allocSync?.(minByteLength) ?? new ArrayBuffer(minByteLength);
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
 * Run a synchronous function while using the specified allocator.
 */
export function withAllocator<T>(allocator: Allocator, fn: T extends Promise<any> ? never : () => T): T {
	const outer = ALLOCATOR;
	try {
		ALLOCATOR = allocator;
		return fn();
	} finally {
		ALLOCATOR = outer;
	}
}

/**
 * Run a synchronous function and zero fill allocated buffers before returning the result.
 */
export function withZeroingUniqueAllocator<T>(fn: T extends Promise<any> ? never : () => T): T {
	const allocator = new ZeroingUniqueAllocator();
	try {
		return withAllocator<T>(allocator, fn);
	} finally {
		allocator.zeroFill();
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

	allocSync(minByteLength: number): ArrayBuffer {
		if (minByteLength > this.buffer.byteLength) {
			return new ArrayBuffer(minByteLength);
		}
		return this.buffer;
	}
}

/**
 * An allocator that always returns unique buffers and allows zero filling all allocated buffers after use.
 */
export class ZeroingUniqueAllocator implements Allocator {
	#buffers: ArrayBuffer[] = [];

	allocSync(minByteLength: number): ArrayBuffer {
		return this.allocUnique(minByteLength);
	}

	allocUnique(byteLength: number): ArrayBuffer {
		const buffer = new ArrayBuffer(byteLength);
		this.#buffers.push(buffer);
		return buffer;
	}

	/**
	 * Zero fill all allocated buffers and discard their references.
	 *
	 * @param exclude Optional array of buffers to exclude from zero filling.
	 */
	zeroFill(): void {
		this.#buffers.forEach(zeroFillBuffer);
		this.#buffers.length = 0;
	}
}
