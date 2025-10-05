import { asUint8Array } from "./bytes.js";

export class Serializer {
	#littleEndian: boolean;
	#byteLength: number;
	#parts: Part[];

	constructor(littleEndian?: boolean) {
		this.#littleEndian = littleEndian ?? true;
		if (typeof this.#littleEndian !== "boolean") {
			throw new TypeError();
		}
		this.#byteLength = 0;
		this.#parts = [];
	}

	get byteLength(): number {
		return this.#byteLength;
	}

	#push(byteLength: number, serializeFn: SerializePartFn): void {
		this.#parts.push({ l: byteLength, s: serializeFn });
		this.#byteLength += byteLength;
	}

	/** Serialize an unsigned 8 bit int. */
	u8(value: number): void {
		if (typeof value !== "number") {
			throw new TypeError();
		}
		if (!Number.isSafeInteger(value) || value < 0 || value > 0xFF) {
			throw new RangeError();
		}
		this.#push(1, (ctx, byteOffset) => {
			ctx.array[byteOffset] = value;
		});
	}

	/** Serialize an unsigned 16 bit int in the serializer's endianess. */
	u16(value: number): void {
		if (typeof value !== "number") {
			throw new TypeError();
		}
		if (!Number.isSafeInteger(value) || value < 0 || value > 0xFF_FF) {
			throw new RangeError();
		}
		this.#push(2, (ctx, byteOffset) => {
			ctx.view.setUint16(byteOffset, value, this.#littleEndian);
		});
	}

	/** Serialize an unsigned 32 bit int in the serializer's endianess. */
	u32(value: number): void {
		if (typeof value !== "number") {
			throw new TypeError();
		}
		if (!Number.isSafeInteger(value) || value < 0 || value > 0xFF_FF_FF_FF) {
			throw new RangeError();
		}
		this.#push(4, (ctx, byteOffset) => {
			ctx.view.setUint32(byteOffset, value, this.#littleEndian);
		});
	}

	/** Serialize an unsigned 64 bit int in the serializer's endianess. */
	u64(value: number): void {
		if (typeof value !== "number") {
			throw new TypeError();
		}
		if (!Number.isSafeInteger(value) || value < 0) {
			throw new RangeError();
		}
		this.#push(8, (ctx, byteOffset) => {
			ctx.view.setBigUint64(byteOffset, BigInt(value), this.#littleEndian);
		});
	}

	/** Serialize an unsigned 64 bit int in the serializer's endianess. */
	bigU64(value: bigint): void {
		if (typeof value !== "bigint") {
			throw new TypeError();
		}
		if (value < 0n || value > 0xFF_FF_FF_FF_FF_FF_FF_FFn) {
			throw new RangeError();
		}
		this.#push(8, (ctx, byteOffset) => {
			ctx.view.setBigUint64(byteOffset, value, this.#littleEndian);
		});
	}

	/** Serialize a 32-bit IEEE 754 floating point number in the serializer's endianess. */
	f32(value: number): void {
		if (typeof value !== "number") {
			throw new TypeError();
		}
		this.#push(4, (ctx, byteOffset) => {
			ctx.view.setFloat32(byteOffset, value, this.#littleEndian);
		});
	}

	/** Serialize a 64-bit IEEE 754 floating point number in the serializer's endianess. */
	f64(value: number): void {
		if (typeof value !== "number") {
			throw new TypeError();
		}
		this.#push(8, (ctx, byteOffset) => {
			ctx.view.setFloat64(byteOffset, value, this.#littleEndian);
		});
	}

	/**
	 * Serialize a boolean.
	 *
	 * + `false` is represented as `0x00`.
	 * + `true` is represented as `0x01`.
	 */
	bool(value: boolean): void {
		if (typeof value !== "boolean") {
			throw new TypeError();
		}
		this.u8(value ? 0x01 : 0x00);
	}

	/**
	 * Serialize an optional value.
	 *
	 * + `null` and `undefined` are serialized using {@link boolean `boolean(false)`}.
	 * + All other values are serialized using {@link boolean `boolean(true)`} followed by immediately calling the specified function.
	 */
	option<T>(value: T | null | undefined, fn: SerializeFn<T>): void {
		if (value === null || value === undefined) {
			this.bool(false);
		} else {
			this.bool(true);
			fn(value, this);
		}
	}

	/**
	 * Serialize bytes by copying them when {@link serialize serializing}.
	 */
	unsafeBytes(value: ArrayBuffer | Uint8Array<ArrayBuffer>): void {
		const bytes = asUint8Array(value);
		this.#push(value.byteLength, (ctx, byteOffset) => {
			ctx.array.set(bytes, byteOffset);
		});
	}

	/**
	 * Serialize bytes by copying them when {@link serialize serializing} prefixed by their byte length.
	 *
	 * See {@link unsafeBytes}.
	 */
	prefixedUnsafeBytes(prefix: SerializePrefixFn, value: ArrayBuffer | Uint8Array<ArrayBuffer>): void {
		const bytes = asUint8Array(value);
		prefix.call(this, value.byteLength);
		this.unsafeBytes(bytes);
	}

	/**
	 * Serialize a utf-8 encoded string.
	 */
	utf8(value: string): void {
		this.unsafeBytes(new TextEncoder().encode(value));
	}

	/**
	 * Serialize a utf-8 encoded string prefixed by it's byte length.
	 */
	prefixedUtf8(prefix: SerializePrefixFn, value: string): void {
		this.prefixedUnsafeBytes(prefix, new TextEncoder().encode(value));
	}

	/**
	 * Write all parts in this serializer to an array buffer.
	 */
	serialize(): ArrayBuffer {
		const buffer = new ArrayBuffer(this.#byteLength);
		const context: SerializeContext = {
			buffer,
			array: new Uint8Array(buffer),
			view: new DataView(buffer),
		};
		const parts = this.#parts;
		let byteOffset = 0;
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			part.s(context, byteOffset);
			byteOffset += part.l;
		}
		return buffer;
	}
}

interface Part {
	l: number;
	s: SerializePartFn;
}

interface SerializeContext {
	buffer: ArrayBuffer;
	array: Uint8Array<ArrayBuffer>;
	view: DataView<ArrayBuffer>;
}

interface SerializePartFn {
	(ctx: SerializeContext, byteOffset: number): void;
}

export interface SerializePrefixFn {
	(this: Serializer, value: number): void;
}

export interface SerializeFn<T> {
	(value: T, serializer: Serializer): void;
}
