import { asUint8Array, Bytes } from "./bytes.js";

/**
 * Utility for serializing binary data.
 */
export class Serializer {
	/**
	 * The default text encoded used for UTF-8.
	 */
	static readonly UTF8 = new TextEncoder();

	/**
	 * The byte length of all parts combined
	 */
	#byteLength = 0;

	/**
	 * Sequence of part properties with offset:
	 * + **3n + 0**: `byteLength: number`
	 * + **3n + 1**: `serializeFn: Serializer.SerializeFn<unknown>`
	 * + **3n + 2**: `value: unknown`
	 */
	readonly #parts: unknown[] = [];

	/**
	 * Get the current byte length of all parts that have been appended to this serializer.
	 */
	get byteLength(): number {
		return this.#byteLength;
	}

	/**
	 * Append a part to serialize.
	 *
	 * @param byteLength The byte length of the part.
	 * @param serialize A function to serialize the value.
	 */
	append(byteLength: number, serialize: Serializer.SerializeFn<void>): this;

	/**
	 * Append a part to serialize.
	 *
	 * @param byteLength The byte length of the part.
	 * @param serialize A function to serialize the value.
	 * @param value The value to serialize.
	 */
	append<T>(byteLength: number, serialize: Serializer.SerializeFn<T>, value: T): this;

	append<T>(byteLength: number, serialize: Serializer.SerializeFn<T>, value?: T): this {
		this.#byteLength += byteLength;
		this.#parts.push(byteLength, serialize, value);
		return this;
	}

	/**
	 * Serialize all parts into a new array buffer.
	 */
	serialize(): ArrayBuffer;

	/**
	 * Serialize all parts into an existing array buffer.
	 *
	 * @param buffer The buffer to serialize into.
	 * @param byteOffset The offset at which to start serializing data. Default is 0.
	 */
	serialize(buffer: ArrayBuffer, byteOffset?: number): ArrayBuffer;

	serialize(buffer: ArrayBuffer = new ArrayBuffer(this.#byteLength), byteOffset = 0): ArrayBuffer {
		const context = {
			buffer,
			array: new Uint8Array(buffer),
			view: new DataView(buffer),
			byteOffset,
		};
		for (let i = 0; i < this.#parts.length; i += 3) {
			(this.#parts[i + 1] as Serializer.SerializeFn<unknown>)(context, this.#parts[i + 2]);
			context.byteOffset += this.#parts[i] as number;
		}
		return buffer;
	}

	/**
	 * Serialize the specified value into this serializer.
	 *
	 * @param value A serializable object or a function to append parts to this serializer.
	 */
	use(value: Serializer.Serializable): this {
		if (typeof value === "function") {
			value(this);
		} else {
			value.serialize(this);
		}
		return this;
	}

	/**
	 * Append an 8-bit sized boolean (0 = false, 1 = true).
	 */
	boolean(value: boolean): this {
		return this.append(1, serializeBoolean, value);
	}

	/**
	 * Serialize a {@link boolean} (false) to indicate that an optional value is absent.
	 */
	none(): this {
		this.boolean(false);
		return this;
	}

	/**
	 * Serialize a {@link boolean} (true) to indicate that an optional value is present.
	 */
	some(): this {
		this.boolean(true);
		return this;
	}

	/**
	 * Serialize {@link none} or {@link some} and the specified value if not null or undefined.
	 */
	useOption(value: Serializer.Serializable | null | undefined): this {
		if (value === null || value === undefined) {
			this.none();
		} else {
			this.some();
			this.use(value);
		}
		return this;
	}

	/**
	 * Serialize {@link none} or {@link some} and the specified value if not null or undefined.
	 */
	option<T>(value: T | null | undefined, serialize: Serializer.SerializePartsFn<T>): this {
		if (value === null || value === undefined) {
			this.none();
		} else {
			this.some();
			serialize(this, value);
		}
		return this;
	}

	/**
	 * Append an 8-bit unsigned integer.
	 */
	uint8(value: number): this {
		if (!Number.isInteger(value) || value < 0 || value > 0xFF) {
			throw new RangeError(`uint8 out of range: ${value}`);
		}
		return this.append(1, serializeUint8, value);
	}

	/**
	 * Append a 16-bit unsigned big endian integer.
	 */
	uint16(value: number): this {
		if (!Number.isInteger(value) || value < 0 || value > 0xFFFF) {
			throw new RangeError(`uint16 out of range: ${value}`);
		}
		return this.append(2, serializeUint16, value);
	}

	/**
	 * Append a 16-bit unsigned little endian integer.
	 */
	uint16le(value: number): this {
		if (!Number.isInteger(value) || value < 0 || value > 0xFFFF) {
			throw new RangeError(`uint16 out of range: ${value}`);
		}
		return this.append(2, serializeUint16le, value);
	}

	/**
	 * Append a 32-bit unsigned big endian integer.
	 */
	uint32(value: number): this {
		if (!Number.isInteger(value) || value < 0 || value > 0xFFFFFFFF) {
			throw new RangeError(`uint32 out of range: ${value}`);
		}
		return this.append(4, serializeUint32, value);
	}

	/**
	 * Append a 32-bit unsigned little endian integer.
	 */
	uint32le(value: number): this {
		if (!Number.isInteger(value) || value < 0 || value > 0xFFFFFFFF) {
			throw new RangeError(`uint32 out of range: ${value}`);
		}
		return this.append(4, serializeUint32le, value);
	}

	/**
	 * Append a 64-bit unsigned big endian integer.
	 */
	uint64(value: bigint): this {
		if (value > 0xFFFFFFFFFFFFFFFFn) {
			throw new RangeError(`uint64 out of range: ${value}`);
		}
		return this.append(8, serializeUint64, value);
	}

	/**
	 * Append a 64-bit unsigned little endian integer.
	 */
	uint64le(value: bigint): this {
		if (value > 0xFFFFFFFFFFFFFFFFn) {
			throw new RangeError(`uint64 out of range: ${value}`);
		}
		return this.append(8, serializeUint64le, value);
	}

	/**
	 * Append a 32-bit IEEE 754 big endian floating point.
	 */
	float32(value: number): this {
		return this.append(4, serializeFloat32, value);
	}

	/**
	 * Append a 32-bit IEEE 754 little endian floating point.
	 */
	float32le(value: number): this {
		return this.append(4, serializeFloat32le, value);
	}

	/**
	 * Append a 64-bit IEEE 754 big endian floating point.
	 */
	float64(value: number): this {
		return this.append(8, serializeFloat64, value);
	}

	/**
	 * Append a 64-bit IEEE 754 little endian floating point.
	 */
	float64le(value: number): this {
		return this.append(8, serializeFloat64le, value);
	}

	/**
	 * Append arbitrary bytes.
	 *
	 * @param bytes The bytes to append.
	 * @param expectedByteLength If specified and the byte length does not match, an error is thrown.
	 */
	bytes(bytes: Bytes, expectedByteLength?: number): this {
		const array = asUint8Array(bytes);
		if (expectedByteLength !== undefined && array.byteLength !== expectedByteLength) {
			throw new RangeError(`unexpected byte length: ${array.byteLength} (expected ${expectedByteLength})`);
		}
		return this.append(array.byteLength, serializeByteArray, array);
	}

	/**
	 * Append UTF-8 encoded text.
	 *
	 * @param value The text to append.
	 * @param expectedByteLength If specified and the byte length does not match, an error is thrown.
	 */
	utf8(value: string, expectedByteLength?: number): this {
		return this.bytes(Serializer.UTF8.encode(value), expectedByteLength);
	}

	/**
	 * Append arbitrary bytes prefixed with the byte length.
	 *
	 * @param prefix A function to append the byte length before the bytes.
	 * @param bytes The bytes to append.
	 */
	prefixedBytes(prefix: Serializer.PrefixFn, bytes: Bytes): this {
		const array = asUint8Array(bytes);
		prefix.call(this, array.byteLength);
		return this.append(array.byteLength, serializeByteArray, array);
	}

	/**
	 * Append UTF-8 encoded text prefixed with the byte length.
	 *
	 * @param prefix A function to append the byte length before the text.
	 * @param value The text to append.
	 */
	prefixedUTF8(prefix: Serializer.PrefixFn, value: string): this {
		return this.prefixedBytes(prefix, Serializer.UTF8.encode(value));
	}

	/**
	 * Serialize an object into a new array buffer.
	 *
	 * @param serializable A serializable object or a function to append parts to a serializer.
	 */
	static serialize(serializable: Serializer.Serializable): ArrayBuffer;

	/**
	 * Serialize an object into an existing array buffer.
	 *
	 * @param serializable A serializable object or a function to append parts to a serializer.
	 * @param buffer The buffer to serialize into.
	 * @param byteOffset The offset at which to start serializing data. Default is 0.
	 */
	static serialize(serializable: Serializer.Serializable, buffer: ArrayBuffer, byteOffset?: number): ArrayBuffer;

	static serialize(serializable: Serializer.Serializable, buffer?: ArrayBuffer, byteOffset?: number): ArrayBuffer {
		const serializer = new Serializer();
		if (typeof serializable === "function") {
			serializable(serializer);
		} else {
			serializable.serialize(serializer);
		}
		return serializer.serialize(buffer!, byteOffset!);
	}
}

export declare namespace Serializer {
	export interface SerializeContext {
		/** The buffer that the part should be serialized to. */
		readonly buffer: ArrayBuffer;
		/** A uint-8 view over the buffer of this context. */
		readonly array: Uint8Array;
		/** A data view over the buffer of this context. */
		readonly view: DataView;
		/** The byte offset at which a part should be serialized. */
		readonly byteOffset: number;
	}

	/**
	 * A function to serialize a part.
	 */
	export type SerializeFn<T> = (context: SerializeContext, value: T) => void;

	export interface SerializableObject {
		/**
		 * Append the parts of this object to the specified serializer.
		 */
		serialize(serializer: Serializer): void;
	}

	/**
	 * A function to append parts to a serializer.
	 */
	export type SerializableFn = (serializer: Serializer) => void;

	/**
	 * A serializable object or function to append parts to a serializer.
	 */
	export type Serializable = SerializableObject | SerializableFn;

	/**
	 * A function to serialize parts of a value.
	 */
	export type SerializePartsFn<T> = (serializer: Serializer, value: T) => void;

	/**
	 * A function to append a byte length to a serializer.
	 */
	export type PrefixFn = (this: Serializer, byteLength: number) => void;
}

function serializeBoolean(ctx: Serializer.SerializeContext, value: boolean): void {
	ctx.view.setUint8(ctx.byteOffset, value ? 1 : 0);
}

function serializeUint8(ctx: Serializer.SerializeContext, value: number): void {
	ctx.view.setUint8(ctx.byteOffset, value);
}

function serializeUint16(ctx: Serializer.SerializeContext, value: number): void {
	ctx.view.setUint16(ctx.byteOffset, value, false);
}

function serializeUint16le(ctx: Serializer.SerializeContext, value: number): void {
	ctx.view.setUint16(ctx.byteOffset, value, true);
}

function serializeUint32(ctx: Serializer.SerializeContext, value: number): void {
	ctx.view.setUint32(ctx.byteOffset, value, false);
}

function serializeUint32le(ctx: Serializer.SerializeContext, value: number): void {
	ctx.view.setUint32(ctx.byteOffset, value, true);
}

function serializeUint64(ctx: Serializer.SerializeContext, value: bigint): void {
	ctx.view.setBigUint64(ctx.byteOffset, value, false);
}

function serializeUint64le(ctx: Serializer.SerializeContext, value: bigint): void {
	ctx.view.setBigUint64(ctx.byteOffset, value, true);
}

function serializeFloat32(ctx: Serializer.SerializeContext, value: number): void {
	ctx.view.setFloat32(ctx.byteOffset, value, false);
}

function serializeFloat32le(ctx: Serializer.SerializeContext, value: number): void {
	ctx.view.setFloat32(ctx.byteOffset, value, true);
}

function serializeFloat64(ctx: Serializer.SerializeContext, value: number): void {
	ctx.view.setFloat64(ctx.byteOffset, value, false);
}

function serializeFloat64le(ctx: Serializer.SerializeContext, value: number): void {
	ctx.view.setFloat64(ctx.byteOffset, value, true);
}

function serializeByteArray(ctx: Serializer.SerializeContext, value: Uint8Array): void {
	ctx.array.set(value, ctx.byteOffset);
}
