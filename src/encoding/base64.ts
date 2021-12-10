import { asUint8Array, Bytes } from "..";
import { getSyncSharedBuffer } from "../shared-buffers";

const TEXT_DECODER = new TextDecoder("ascii");
const TEXT_ENCODER = new TextEncoder();

const BASE64_TO_ASCII = new Uint8Array(64);
const BASE64URL_TO_ASCII = new Uint8Array(64);

const ASCII_TO_BASE64 = new Uint16Array(123);
const ASCII_TO_BASE64URL = new Uint16Array(123);

const PAD_ASCII = "=".charCodeAt(0);

{
	TEXT_ENCODER.encodeInto("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", BASE64_TO_ASCII);
	TEXT_ENCODER.encodeInto("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", BASE64URL_TO_ASCII);
	for (let i = 0; i < 64; i++) {
		ASCII_TO_BASE64[BASE64_TO_ASCII[i]] = i | 0x8000;
		ASCII_TO_BASE64URL[BASE64URL_TO_ASCII[i]] = i | 0x8000;
	}
}

function encode(value: Bytes, map: Uint8Array, pad: boolean): string {
	const bytes = asUint8Array(value);
	const base64Length = pad ? Math.ceil(bytes.byteLength / 3) * 4 : Math.ceil(bytes.byteLength * 4 / 3);
	const base64 = new Uint8Array(getSyncSharedBuffer(base64Length), 0, base64Length);
	for (let i = 0, x = 0; i < bytes.byteLength;) {
		const a = bytes[i];
		base64[x++] = map[a >>> 2];
		if (++i < bytes.byteLength) {
			const b = bytes[i];
			base64[x++] = map[((a & 0x3) << 4) | b >>> 4];
			if (++i < bytes.byteLength) {
				const c = bytes[i];
				base64[x++] = map[((b & 0xf) << 2) | c >>> 6];
				base64[x++] = map[c & 0x3f];
				i++;
			} else {
				base64[x++] = map[(b & 0xf) << 2];
				if (pad) {
					base64[x++] = PAD_ASCII;
				}
			}
		} else {
			base64[x++] = map[(a & 0x3) << 4];
			if (pad) {
				base64[x++] = PAD_ASCII;
				base64[x++] = PAD_ASCII;
			}
		}
	}
	return TEXT_DECODER.decode(base64);
}

function decode(value: string, map: Uint16Array): Uint8Array {
	const base64 = new Uint8Array(getSyncSharedBuffer(value.length));
	TEXT_ENCODER.encodeInto(value, base64);

	let padding = 0;
	for (let i = value.length - 1; i >= 0; i--) {
		if (base64[i] === PAD_ASCII) {
			padding++;
		} else {
			break;
		}
	}

	const base64Length = value.length - padding;
	const partial = base64Length & 0x3;
	if (partial === 1) {
		throw new TypeError("invalid data");
	}
	const byteLength = (base64Length >>> 2) * 3 + (partial >>> 1) + (partial & 0x1);
	const bytes = new Uint8Array(byteLength);
	for (let i = 0, x = 0; i < byteLength;) {
		const a = map[base64[x++]];
		const b = map[base64[x++]];
		if (a === 0 || a === undefined || b === 0 || b === undefined) {
			throw new TypeError("invalid data");
		}
		bytes[i++] = (a << 2) | (b >>> 4);
		if (i < byteLength) {
			const c = map[base64[x++]];
			if (c === 0 || c === undefined) {
				throw new TypeError("invalid data");
			}
			bytes[i++] = (b << 4) | (c >>> 2);
			if (i < byteLength) {
				const d = map[base64[x++]];
				if (d === 0 || d === undefined) {
					throw new TypeError("invalid data");
				}
				bytes[i++] = (c << 6) | d;
			}
		}
	}
	return bytes;
}

/**
 * Base64 encode bytes.
 *
 * @param value The bytes to encode.
 */
export function encodeBase64(value: Bytes): string {
	return encode(value, BASE64_TO_ASCII, true);
}

/**
 * Base64url encode bytes without padding characters.
 *
 * @param value The bytes to encode.
 * @param padding True, to include padding. Default is false.
 */
export function encodeBase64URL(value: Bytes, padding = false): string {
	return encode(value, BASE64URL_TO_ASCII, padding);
}

/**
 * Decode base64 encoded text.
 *
 * This does support padding characters, but not concatenated base64 strings.
 *
 * @param value The text to decode.
 */
export function decodeBase64(value: string): Uint8Array {
	return decode(value, ASCII_TO_BASE64);
}

/**
 * Decode base64url encoded text.
 *
 * This does support padding characters, but not concatenated base64url strings.
 *
 * @param value The text to decode.
 */
export function decodeBase64URL(value: string): Uint8Array {
	return decode(value, ASCII_TO_BASE64URL);
}
