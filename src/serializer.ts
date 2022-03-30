import { asUint8Array, Bytes } from "./bytes";

/**
 * Utility for serializing binary data.
 */
export class Serializer {
	/**
	 * The default text encoded used for UTF-8.
	 */
	public static readonly UTF8 = new TextEncoder();

	/**
	 * The byte length of all parts combined
	 */
	#byteLength = 0;

	/**
	 * The raw parts to serialize
	 */
	readonly #parts: Part[] = [];

	/**
	 * Get the current byte length of all parts that have been appended to this serializer.
	 */
	public get byteLength() {
		return this.#byteLength;
	}

	/**
	 * Append a part to serialize.
	 *
	 * @param byteLength The byte length of the part.
	 * @param serialize A function to serialize the value.
	 */
	public append(byteLength: number, serialize: Serializer.SerializeFn<void>): this;

	/**
	 * Append a part to serialize.
	 *
	 * @param byteLength The byte length of the part.
	 * @param serialize A function to serialize the value.
	 * @param value The value to serialize.
	 */
	public append<T>(byteLength: number, serialize: Serializer.SerializeFn<T>, value: T): this;

	public append(byteLength: number, serialize: Serializer.SerializeFn<any>, value?: any): this {
		this.#byteLength += byteLength;
		this.#parts.push({
			byteLength,
			serialize: serialize,
			value,
		});
		return this;
	}

	/**
	 * Serialize all parts into a new array buffer.
	 */
	public serialize(): ArrayBuffer;

	/**
	 * Serialize all parts into an existing array buffer.
	 *
	 * @param buffer The buffer to serialize into.
	 * @param byteOffset The offset at which to start serializing data. Default is 0.
	 */
	public serialize(buffer: ArrayBuffer, byteOffset?: number): ArrayBuffer;

	public serialize(buffer: ArrayBuffer = new ArrayBuffer(this.#byteLength), byteOffset = 0): ArrayBuffer {
		const context = {
			buffer,
			array: new Uint8Array(buffer),
			view: new DataView(buffer),
			byteOffset,
		};
		for (let i = 0; i < this.#parts.length; i++) {
			const part = this.#parts[i];
			part.serialize(context, part.value);
			context.byteOffset += part.byteLength;
		}
		return buffer;
	}

	/**
	 * Append an 8-bit unsigned integer.
	 */
	public uint8(value: number): this {
		if (!Number.isInteger(value) || value < 0 || value > 0xFF) {
			throw new RangeError(`uint8 out of range: ${value}`);
		}
		return this.append(1, serializeUint8, value);
	}

	/**
	 * Append a 16-bit unsigned big endian integer.
	 */
	public uint16(value: number): this {
		if (!Number.isInteger(value) || value < 0 || value > 0xFFFF) {
			throw new RangeError(`uint16 out of range: ${value}`);
		}
		return this.append(2, serializeUint16, value);
	}

	/**
	 * Append a 16-bit unsigned little endian integer.
	 */
	public uint16le(value: number): this {
		if (!Number.isInteger(value) || value < 0 || value > 0xFFFF) {
			throw new RangeError(`uint16 out of range: ${value}`);
		}
		return this.append(2, serializeUint16le, value);
	}

	/**
	 * Append a 32-bit unsigned big endian integer.
	 */
	public uint32(value: number): this {
		if (!Number.isInteger(value) || value < 0 || value > 0xFFFFFFFF) {
			throw new RangeError(`uint32 out of range: ${value}`);
		}
		return this.append(4, serializeUint32, value);
	}

	/**
	 * Append a 32-bit unsigned little endian integer.
	 */
	public uint32le(value: number): this {
		if (!Number.isInteger(value) || value < 0 || value > 0xFFFFFFFF) {
			throw new RangeError(`uint32 out of range: ${value}`);
		}
		return this.append(4, serializeUint32le, value);
	}

	/**
	 * Append a 64-bit unsigned big endian integer.
	 */
	public uint64(value: bigint): this {
		if (value > 0xFFFFFFFFFFFFFFFFn) {
			throw new RangeError(`uint64 out of range: ${value}`);
		}
		return this.append(8, serializeUint64, value);
	}

	/**
	 * Append a 64-bit unsigned little endian integer.
	 */
	public uint64le(value: bigint): this {
		if (value > 0xFFFFFFFFFFFFFFFFn) {
			throw new RangeError(`uint64 out of range: ${value}`);
		}
		return this.append(8, serializeUint64le, value);
	}

	/**
	 * Append a 32-bit IEEE 754 big endian floating point.
	 */
	public float32(value: number): this {
		return this.append(4, serializeFloat32, value);
	}

	/**
	 * Append a 32-bit IEEE 754 little endian floating point.
	 */
	public float32le(value: number): this {
		return this.append(4, serializeFloat32le, value);
	}

	/**
	 * Append a 64-bit IEEE 754 big endian floating point.
	 */
	public float64(value: number): this {
		return this.append(8, serializeFloat64, value);
	}

	/**
	 * Append a 64-bit IEEE 754 little endian floating point.
	 */
	public float64le(value: number): this {
		return this.append(8, serializeFloat64le, value);
	}

	/**
	 * Append arbitrary bytes.
	 *
	 * @param bytes The bytes to append.
	 * @param expectedByteLength If specified and the byte length does not match, an error is thrown.
	 */
	public bytes(bytes: Bytes, expectedByteLength?: number): this {
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
	public utf8(value: string, expectedByteLength?: number): this {
		return this.bytes(Serializer.UTF8.encode(value), expectedByteLength);
	}

	/**
	 * Append arbitrary bytes prefixed with the byte length.
	 *
	 * @param prefix A function to append the byte length before the bytes.
	 * @param bytes The bytes to append.
	 */
	public prefixedBytes(prefix: Serializer.PrefixFn, bytes: Bytes): this {
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
	public prefixedUTF8(prefix: Serializer.PrefixFn, value: string): this {
		return this.prefixedBytes(prefix, Serializer.UTF8.encode(value));
	}

	/**
	 * Serialize an object into a new array buffer.
	 *
	 * @param serializable A serializable object or a function to append parts to a serializer.
	 */
	public static serialize(serializable: Serializer.Serializable): ArrayBuffer

	/**
	 * Serialize an object into an existing array buffer.
	 *
	 * @param serializable A serializable object or a function to append parts to a serializer.
	 * @param buffer The buffer to serialize into.
	 * @param byteOffset The offset at which to start serializing data. Default is 0.
	 */
	public static serialize(serializable: Serializer.Serializable, buffer: ArrayBuffer, byteOffset?: number): ArrayBuffer

	public static serialize(serializable: Serializer.Serializable, buffer?: ArrayBuffer, byteOffset?: number): ArrayBuffer {
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
	 * A function to append a byte length to a serializer.
	 */
	export type PrefixFn = (this: Serializer, byteLength: number) => void;
}

interface Part {
	readonly byteLength: number;
	readonly serialize: Serializer.SerializeFn<any>;
	readonly value: unknown;
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
