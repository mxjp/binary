import { asUint8Array, Bytes } from "./bytes";

/**
 * Queue for bytes that can be used as buffer for deserializing data from a readable stream.
 */
export class ByteQueue {
	readonly #chunks: Uint8Array[] = [];
	#byteLength = 0;

	/**
	 * Get the current number of bytes in this queue.
	 */
	public get byteLength() {
		return this.#byteLength;
	}

	/**
	 * Remove all bytes from the queue.
	 */
	public clear() {
		this.#chunks.length = 0;
		this.#byteLength = 0;
	}

	/**
	 * Enqueue bytes.
	 *
	 * @param bytes The bytes to enqueue.
	 * @returns The new byte length of this queue.
	 */
	public enqueue(bytes: Bytes): number {
		if (bytes.byteLength > 0) {
			this.#chunks.push(asUint8Array(bytes));
			this.#byteLength += bytes.byteLength;
		}
		return this.#byteLength;
	}

	#dequeue(byteLength: number, array: Uint8Array, remove: boolean): void {
		let i = 0;
		let byteOffset = 0;
		for (;;) {
			const chunk = this.#chunks[i];
			const remaining = byteLength - byteOffset;
			if (remaining < chunk.byteLength) {
				array.set(new Uint8Array(chunk.buffer, chunk.byteOffset, remaining), byteOffset);
				if (remove) {
					this.#chunks.splice(0, i + 1, new Uint8Array(chunk.buffer, chunk.byteOffset + remaining, chunk.byteLength - remaining));
					this.#byteLength -= byteLength;
				}
				break;
			} else {
				array.set(chunk, byteOffset);
				if (remaining === chunk.byteLength) {
					if (remove) {
						this.#chunks.splice(0, i + 1);
						this.#byteLength -= byteLength;
					}
					break;
				}
				byteOffset += chunk.byteLength;
				i++;
			}
		}
	}

	/**
	 * Dequeue bytes.
	 *
	 * @param byteLength The maximum number of bytes to dequeue. If not specified, all bytes are dequeued.
	 * @param remove If false, bytes are not dequeued. Default is true.
	 * @returns The dequeued bytes.
	 */
	public dequeue(byteLength: number = this.#byteLength, remove = true): Uint8Array {
		if (byteLength > this.#byteLength) {
			byteLength = this.#byteLength;
		}
		const array = new Uint8Array(byteLength);
		if (byteLength > 0) {
			this.#dequeue(byteLength, array, remove);
		}
		return array;
	}

	/**
	 * Dequeue bytes.
	 *
	 * @param bytes The buffer to dequeue into.
	 * @param byteLength The maximum number of bytes to dequeue.
	 * @param remove If false, bytes are not dequeued. Default is true.
	 */
	public dequeueInto(bytes: Bytes, byteLength = bytes.byteLength, remove = true): number {
		byteLength = Math.min(byteLength, bytes.byteLength, this.#byteLength);
		if (byteLength > 0) {
			const array = asUint8Array(bytes);
			this.#dequeue(byteLength, array, remove);
		}
		return byteLength;
	}
}
