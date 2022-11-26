import { concatBytes, Deserializer } from ".";

/**
 * Utility for deserializing binary data from a stream.
 *
 * All API that is provided by an instance of this class may **NOT** be used in parallel.
 */
export class StreamDeserializer {
	/**
	 * The stream reader data is deserialized from.
	 */
	readonly #reader: ReadableStreamDefaultReader<Uint8Array>;

	/**
	 * A deserializer for the current chunk of data.
	 */
	#deserializer: Deserializer | null = null;

	/**
	 * True, if all chunks have been read from the stream.
	 */
	#done: boolean;

	/**
	 * Create a new stream deserializer for the given readable.
	 */
	constructor(stream: ReadableStream<Uint8Array>) {
		this.#reader = stream.getReader();
		this.#done = false;
	}

	#push(chunks: Uint8Array[], chunksByteLength?: number) {
		if (chunks.length > 0) {
			if (this.#deserializer === null) {
				this.#deserializer = new Deserializer(concatBytes(chunks, chunksByteLength));
			} else {
				this.#deserializer.push(chunks, chunksByteLength);
			}
		}
	}

	/**
	 * Deserialize data from the stream.
	 *
	 * @param deserialize The function to deserialize. If a `RangeError` is thrown and additional data can be read, the deserialization is repeated.
	 * @param requiredByteLength Number of bytes that must be available before deserializing. If the stream ends before this number of bytes is reached, a `RangeError` is thrown.
	 */
	async deserialize<T>(deserialize: StreamDeserializer.DeserializeFn<T>, requiredByteLength = 0): Promise<T> {
		for (;;) {
			if (this.#deserializer !== null && this.#deserializer.bytesAvailable >= requiredByteLength) {
				const restoreCheckpoint = this.#deserializer.checkpoint();
				try {
					return deserialize(this.#deserializer, value => {
						requiredByteLength = value;
					});
				} catch (error) {
					restoreCheckpoint();
					if (this.#done || !(error instanceof RangeError)) {
						throw error;
					}
				}
			}

			const bytesAvailable = this.#deserializer?.bytesAvailable ?? 0;

			const chunks: Uint8Array[] = [];
			let chunksByteLength = 0;

			for (;;) {
				const { done, value } = await this.#reader.read();
				if (value !== undefined && value.byteLength > 0) {
					chunks.push(value);
					chunksByteLength += value.byteLength;
				}
				if (done) {
					this.#push(chunks, chunksByteLength);
					this.#done = true;
					if ((bytesAvailable + chunksByteLength) < requiredByteLength) {
						throw new RangeError("end of stream");
					} else {
						break;
					}
				} else if ((bytesAvailable + chunksByteLength) >= requiredByteLength) {
					this.#push(chunks, chunksByteLength);
					break;
				}
			}
		}
	}

	/**
	 * Check if all data has been deserialized.
	 *
	 * If the underlying stream has not ended yet, a single chunk is read to determine if there is data available.
	 */
	async ended(): Promise<boolean> {
		if (this.#deserializer !== null && this.#deserializer.bytesAvailable > 0) {
			return false;
		}
		if (!this.#done) {
			const { done, value } = await this.#reader.read();
			if (value !== undefined && value.byteLength > 0) {
				this.#push([value]);
			}
			if (done) {
				this.#done = true;
			}
		}
		return this.#done && (this.#deserializer === null || this.#deserializer.bytesAvailable === 0);
	}

	/**
	 * Cancel the underlying reader.
	 */
	cancel(reason: unknown): Promise<void> {
		return this.#reader.cancel(reason);
	}

	/**
	 * Release the underlying reader.
	 *
	 * @returns The current deserializer if there is any to get access to the data
	 * that has already be read from the stream.
	 */
	releaseLock(): Deserializer | null {
		this.#reader.releaseLock();
		return this.#deserializer;
	}
}

export declare namespace StreamDeserializer {
	export interface SetRequiredByteLengthFn {
		(requiredByteLength: number): void;
	}

	export interface DeserializeFn<T> {
		/**
		 * @param deserializer The current deserializer.
		 * @param setRequiredByteLength A function to set the number of bytes that must be available before the next deserialization attempt.
		 */
		(deserializer: Deserializer, setRequiredByteLength: SetRequiredByteLengthFn): T;
	}
}
