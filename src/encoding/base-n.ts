import { asDataView, Bytes } from "..";

export class BaseNAlphabet {
	public readonly base: bigint;
	public readonly values: Uint16Array;

	/**
	 * Create a new base-n alphabet.
	 *
	 * @param chars The ascii characters to use.
	 * @param allowBinary True to allow creating binary based alphabets. Default is false.
	 */
	public constructor(public readonly chars: string, allowBinary = false) {
		if (!allowBinary && Number.isInteger(Math.log2(chars.length))) {
			throw new Error("binary based alphabets should not be used.");
		}

		this.base = BigInt(chars.length);
		this.values = new Uint16Array(256);
		for (let i = 0; i < chars.length; i++) {
			const charCode = chars.charCodeAt(i);
			if (charCode >= 256) {
				throw new TypeError("non ascii characters are not supported");
			}
			this.values[charCode] = i | 0x100;
		}

		if (new Set(chars).size < chars.length) {
			throw new TypeError("alphabet contains duplicate chars");
		}
	}
}

const BYTE_LIMIT = 256;

/**
 * Base62 alphabet with the following characters: `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`
 */
export const BASE62 = new BaseNAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");

/**
 * Base58 alphabet with the following characters: `123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`
 */
export const BASE58 = new BaseNAlphabet("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");

/**
 * Encode bytes with the specified alphabet.
 *
 * Note, that the time complexity of this function is about `O(n²)` where n is the size of the data.
 *
 * @param value The bytes to encode.
 * @param alphabet The alphabet to use.
 * @param padding True to include padding, so that trailing zeros are also included in the output. This is required to correctly decode the raw data. Default is true.
 * @param byteLimit The maximum number of bytes to encode. If this is exceeded, a `RangeError` is thrown. For bigints, the byte size is approximated, for numbers this parameter is ignored. Default is 256 bytes.
 */
export function encodeBaseN(value: Bytes | number | bigint, alphabet: BaseNAlphabet, padding = true, byteLimit = BYTE_LIMIT): string {
	let base2 = 0n;
	let bytes: DataView | null = null;
	if (typeof value === "number") {
		if (!Number.isSafeInteger(value) || value < 0) {
			throw new TypeError("value must be a positive integer");
		}
		base2 = BigInt(value);
	} else if (typeof value === "bigint") {
		if (value < 0n) {
			throw new TypeError("value must be a positive integer");
		}
		if (Math.log2(Number(value)) / 8 > byteLimit) {
			throw new RangeError("value exceeds byte limit");
		}
		base2 = value;
	} else {
		bytes = asDataView(value);
		if (bytes.byteLength > byteLimit) {
			throw new RangeError("value exceeds byte limit");
		}
		const margin64 = bytes.byteLength - 8;
		for (let i = 0;;) {
			if (i <= margin64) {
				base2 = (base2 << 64n) + bytes.getBigUint64(i, false);
				i += 8;
			} else if (i <= bytes.byteLength - 4) {
				base2 = (base2 << 32n) + BigInt(bytes.getUint32(i, false));
				i += 4;
			} else if (i <= bytes.byteLength - 2) {
				base2 = (base2 << 16n) + BigInt(bytes.getUint16(i, false));
				i += 2;
			} else if (i < bytes.byteLength) {
				base2 = (base2 << 8n) + BigInt(bytes.getUint8(i));
				i++;
			} else {
				break;
			}
		}
	}

	const parts: string[] = [];
	while (base2 > 0n) {
		const next = base2 / alphabet.base;
		const digit = base2 - (next * alphabet.base);
		parts.unshift(alphabet.chars[Number(digit)]);
		base2 = next;
	}

	if (padding && bytes !== null) {
		const minLength = Math.ceil((bytes.byteLength * 8) / Math.log2(alphabet.chars.length));
		while (parts.length < minLength) {
			parts.unshift(alphabet.chars[0]);
		}
	}

	return parts.join("");
}

/**
 * Decode bytes that have been encoded with the specified alphabet.
 *
 * To correclty decode 8-bit aligned data, this function assumes that the most significant (the first) digit is only partially used.
 *
 * Note, that the time complexity of this function is about `O(n²)` where n is the size of the data.
 *
 * @param value The text to decode.
 * @param alphabet The alphabet to use.
 * @param byteLimit The maximum number of bytes to decode. If this is exceeded, a `RangeError` is thrown. Default is 256 bytes.
 */
export function decodeBaseN(value: string, alphabet: BaseNAlphabet, byteLimit = BYTE_LIMIT): Uint8Array {
	const byteLength = Math.floor(Math.ceil(value.length * Math.log2(alphabet.chars.length)) / 8);
	if (byteLength > byteLimit) {
		throw new RangeError("value exceeds byte limit");
	}

	const bytes = new Uint8Array(byteLength);
	let base2 = 0n;
	for (let i = 0; i < value.length; i++) {
		const digit = alphabet.values[value.charCodeAt(i)];
		if (digit === 0) {
			throw new TypeError("invalid data");
		}
		base2 = (base2 * alphabet.base) + BigInt(digit & 0xff);
	}
	for (let i = byteLength - 1; i >= 0; i--) {
		bytes[i] = Number(base2 & 0xFFn);
		base2 = base2 >> 8n;
	}
	return bytes;
}
