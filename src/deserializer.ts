
export class Deserializer {
	#littleEndian: boolean;
	#buffer: ArrayBuffer;
	#byteOffset: number;
	#byteLength: number;
	#view: DataView;

	constructor(buffer: ArrayBuffer, byteOffset: number, byteLength: number, littleEndian?: boolean) {
		this.#littleEndian = littleEndian ?? true;
		if (typeof this.#littleEndian !== "boolean" || buffer.constructor !== ArrayBuffer || !Number.isSafeInteger(byteOffset) || !Number.isSafeInteger(byteLength)) {
			throw new TypeError();
		}
		if (byteOffset < 0 || byteLength < 0 || (byteOffset + byteLength) > buffer.byteLength) {
			throw new RangeError();
		}
		this.#buffer = buffer;
		this.#byteOffset = byteOffset;
		this.#byteLength = byteLength;
		this.#view = new DataView(buffer);
	}

	get bytesAvailable(): number {
		return this.#byteLength - this.#byteOffset;
	}

	#advanceBy(byteLength: number): number {
		const byteOffset = this.#byteOffset;
		const next = byteOffset + byteLength;
		if (next > this.#byteLength) {
			throw new DeserializerEndError();
		}
		this.#byteOffset = next;
		return byteOffset;
	}

	/**
	 * Create a copy of this deserializer in it's current state that views the same underlying data.
	 */
	fork(): Deserializer {
		return new Deserializer(this.#buffer, this.#byteOffset, this.#byteLength, this.#littleEndian);
	}

	/** Deserialize an unsigned 8 bit int. */
	u8(): number {
		return this.#view.getUint8(this.#advanceBy(1));
	}

	/** Deserialize an unsigned 16 bit int in the deserializer's endianess. */
	u16(): number {
		return this.#view.getUint16(this.#advanceBy(2), this.#littleEndian);
	}

	/** Deserialize an unsigned 32 bit int in the deserializer's endianess. */
	u32(): number {
		return this.#view.getUint32(this.#advanceBy(4), this.#littleEndian);
	}

	/** Deserialize an unsigned 64 bit int in the deserializer's endianess. */
	u64(): number {
		const value = this.bigU64();
		if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
			throw new RangeError();
		}
		return Number(value);
	}

	/** Deserialize an unsigned 64 bit int in the deserializer's endianess. */
	bigU64(): bigint {
		return this.#view.getBigUint64(this.#advanceBy(8), this.#littleEndian);
	}

	/** Deserialize a 32-bit IEEE 754 floating point number in the deserializer's endianess. */
	f32(): number {
		return this.#view.getFloat32(this.#advanceBy(4), this.#littleEndian);
	}

	/** Deserialize a 64-bit IEEE 754 floating point number in the deserializer's endianess. */
	f64(): number {
		return this.#view.getFloat64(this.#advanceBy(8), this.#littleEndian);
	}

	/**
	 * Deserialize a boolean.
	 *
	 * + `false` is represented as `0x00`.
	 * + `true` is represented as `0x01`.
	 */
	bool(): boolean {
		switch (this.u8()) {
			case 0x00: return false;
			case 0x01: return true;
			default: throw new RangeError();
		}
	}

	/**
	 * Deserialize bytes by creating a view into the underlying data.
	 *
	 * @example
	 * ```js
	 * let array = d.unsafeViewBytes(7, Uint8Array);
	 * ```
	 */
	unsafeViewBytes<T extends typeof Uint8Array<ArrayBuffer> | typeof Uint16Array<ArrayBuffer> | typeof Uint32Array<ArrayBuffer> | typeof DataView<ArrayBuffer>>(byteLength: number, ctor: T): InstanceType<T> {
		const byteOffset = this.#advanceBy(byteLength);
		return new (ctor as typeof Uint8Array)(this.#buffer, byteOffset, byteLength) as InstanceType<T>;
	}

	/**
	 * Deserialize bytes by copying.
	 */
	copyBytes(byteLength: number): ArrayBuffer {
		const byteOffset = this.#advanceBy(byteLength);
		return this.#buffer.slice(byteOffset, byteOffset + byteLength);
	}
}

export class DeserializerEndError extends Error {}
