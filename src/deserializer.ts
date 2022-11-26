import { Bytes } from "./bytes.js";

/**
 * Utility for deserializing binary data.
 */
export class Deserializer {
	/**
	 * The default text decoder used for UTF-8.
	 */
	static readonly UTF8 = new TextDecoder("utf-8", { fatal: true });

	/**
	 * The underlying buffer to read from.
	 */
	#buffer: ArrayBuffer;

	/**
	 * A data view over the complete underlying buffer.
	 */
	#view: DataView;

	/**
	 * The exclusive byte offset in the underlying buffer from which this deserializer may read.
	 */
	#endByteOffset: number;

	/**
	 * The current byte offset in the underlying buffer at which to read the next part.
	 */
	#byteOffset: number;

	/**
	 * Create a new deserializer that views the specified data.
	 *
	 * @param data The data to read.
	 * @param byteOffset The byte offset from where to read.
	 * @param byteLength The byte length that is available for reading.
	 */
	constructor(data: Bytes, byteOffset?: number, byteLength?: number) {
		if (data instanceof ArrayBuffer) {
			this.#buffer = data;
			this.#byteOffset = byteOffset ?? 0;
			this.#endByteOffset = byteLength === undefined ? data.byteLength : (this.#byteOffset + byteLength);
			if (this.#byteOffset < 0 || this.#byteOffset > this.#endByteOffset || this.#endByteOffset > this.#buffer.byteLength) {
				throw new RangeError("byteOffset or byteLength is out of buffer range");
			}
		} else {
			this.#buffer = data.buffer;
			this.#byteOffset = byteOffset === undefined ? data.byteOffset : data.byteOffset + byteOffset;
			this.#endByteOffset = byteLength === undefined ? data.byteOffset + data.byteLength : this.#byteOffset + byteLength;
			if (this.#byteOffset < data.byteOffset || this.#byteOffset > this.#endByteOffset || this.#endByteOffset > (data.byteOffset + data.byteLength)) {
				throw new RangeError("byteOffset or byteLength is out of view range");
			}
		}
		this.#view = new DataView(this.#buffer);
	}

	/**
	 * The underlying array buffer.
	 */
	get buffer(): ArrayBuffer {
		return this.#buffer;
	}

	/**
	 * The current byte offset.
	 */
	get byteOffset(): number {
		return this.#byteOffset;
	}

	/**
	 * The current number of bytes available to deserialize.
	 */
	get bytesAvailable(): number {
		return this.#endByteOffset - this.#byteOffset;
	}

	/**
	 * Replace the underlying buffer with the current remaining data concatenated with the specified chunks.
	 */
	push(chunks: Uint8Array[], chunksByteLength?: number): void {
		const oldByteLength = this.bytesAvailable;
		let newByteLength = oldByteLength;
		if (chunksByteLength === undefined) {
			for (let i = 0; i < chunks.length; i++) {
				newByteLength += chunks[i].byteLength;
			}
		} else {
			newByteLength += chunksByteLength;
		}

		const array = new Uint8Array(newByteLength);
		if (oldByteLength > 0) {
			array.set(new Uint8Array(this.#buffer, this.#byteOffset, oldByteLength), 0);
		}
		for (let i = 0, o = oldByteLength; i < chunks.length; i++) {
			const chunk = chunks[i];
			array.set(chunk, o);
			o += chunk.byteLength;
		}

		this.#buffer = array.buffer;
		this.#byteOffset = array.byteOffset;
		this.#endByteOffset = array.byteOffset + newByteLength;
		this.#view = new DataView(this.#buffer);
	}

	/**
	 * Create a checkpoint at the current byte offset that can be restored
	 * as long as the underlying buffer has not been replaced.
	 */
	checkpoint(): Deserializer.RestoreCheckpointFn {
		const buffer = this.#buffer;
		const byteOffset = this.#byteOffset;
		return () => {
			if (this.#buffer !== buffer) {
				throw new Error("underlying buffer has been replaced");
			}
			this.#byteOffset = byteOffset;
		};
	}

	/**
	 * Get the current byte offset and mark the next n bytes as read.
	 */
	#mark(byteLength: number) {
		const start = this.#byteOffset;
		const end = start + byteLength;
		if (end > this.#endByteOffset) {
			throw new RangeError("end of data");
		}
		this.#byteOffset = end;
		return start;
	}

	/**
	 * Read an 8-bit unsigned integer.
	 */
	uint8(): number {
		return this.#view.getUint8(this.#mark(1));
	}

	/**
	 * Read a 16-bit unsigned big endian integer.
	 */
	uint16(): number {
		return this.#view.getUint16(this.#mark(2), false);
	}

	/**
	 * Read a 16-bit unsigned little endian integer.
	 */
	uint16le(): number {
		return this.#view.getUint16(this.#mark(2), true);
	}

	/**
	 * Read a 32-bit unsigned big endian integer.
	 */
	uint32(): number {
		return this.#view.getUint32(this.#mark(4), false);
	}

	/**
	 * Read a 32-bit unsigned little endian integer.
	 */
	uint32le(): number {
		return this.#view.getUint32(this.#mark(4), true);
	}

	/**
	 * Read a 64-bit unsigned big endian integer.
	 */
	uint64(): bigint {
		return this.#view.getBigUint64(this.#mark(8), false);
	}

	/**
	 * Read a 64-bit unsigned little endian integer.
	 */
	uint64le(): bigint {
		return this.#view.getBigUint64(this.#mark(8), true);
	}

	/**
	 * Read a 32-bit IEEE 754 big endian floating point.
	 */
	float32(): number {
		return this.#view.getFloat32(this.#mark(4), false);
	}

	/**
	 * Read a 32-bit IEEE 754 big endian floating point.
	 */
	float32le(): number {
		return this.#view.getFloat32(this.#mark(4), true);
	}

	/**
	 * Read a 64-bit IEEE 754 big endian floating point.
	 */
	float64(): number {
		return this.#view.getFloat64(this.#mark(8), false);
	}

	/**
	 * Read a 64-bit IEEE 754 little endian floating point.
	 */
	float64le(): number {
		return this.#view.getFloat64(this.#mark(8), true);
	}

	/**
	 * Read the next n bytes by creating an Uint8Array that views the underlying buffer.
	 */
	array(byteLength: number): Uint8Array {
		return new Uint8Array(this.#buffer, this.#mark(byteLength), byteLength);
	}

	/**
	 * Read the next n bytes by creating a DataView that views the underlying buffer.
	 */
	view(byteLength: number): DataView {
		return new DataView(this.#buffer, this.#mark(byteLength), byteLength);
	}

	/**
	 * Read the next n bytes by copying into a new ArrayBuffer.
	 */
	slice(byteLength: number): ArrayBuffer {
		const start = this.#mark(byteLength);
		return this.#buffer.slice(start, start + byteLength);
	}

	/**
	 * Read the next n bytes as UTF-8 encoded text.
	 *
	 * Note that a `DOMException` is thrown if an encoding error is found.
	 */
	utf8(byteLength: number): string {
		return Deserializer.UTF8.decode(this.array(byteLength));
	}
}

export declare namespace Deserializer {
	export type RestoreCheckpointFn = () => void;
}
