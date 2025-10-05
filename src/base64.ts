import { asUint8Array, Bytes } from "./bytes.js";

const BASE64_TO_ASCII = new TextEncoder().encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
const BASE64URL_TO_ASCII = new TextEncoder().encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_");

const ASCII_TO_BASE64 = new Uint16Array(123);
const ASCII_TO_BASE64URL = new Uint16Array(123);
for (let i = 0; i < 64; i++) {
	ASCII_TO_BASE64[BASE64_TO_ASCII[i]] = i | 0x8000;
	ASCII_TO_BASE64URL[BASE64URL_TO_ASCII[i]] = i | 0x8000;
}

const PAD_ASCII = "=".charCodeAt(0);

function encode(bytes: Uint8Array<ArrayBuffer>, map: Uint8Array<ArrayBuffer>, padding: boolean): string {
	const base64Length = padding ? Math.ceil(bytes.byteLength / 3) * 4 : Math.ceil(bytes.byteLength * 4 / 3);
	const base64 = new Uint8Array(base64Length);
	for (let i = 0, x = 0; i < bytes.byteLength;) {
		const a = bytes[i];
		base64[x++] = map[a >>> 2];
		if (++i < bytes.byteLength) {
			const b = bytes[i];
			base64[x++] = map[((a & 3) << 4) | (b >>> 4)];
			if (++i < bytes.byteLength) {
				const c = bytes[i];
				base64[x++] = map[((b & 0xf) << 2) | (c >>> 6)];
				base64[x++] = map[c & 0x3f];
				i++;
			} else {
				base64[x++] = map[(b & 0xf) << 2];
				if (padding) {
					base64[x++] = PAD_ASCII;
				}
			}
		} else {
			base64[x++] = map[(a & 3) << 4];
			if (padding) {
				base64[x++] = PAD_ASCII;
				base64[x++] = PAD_ASCII;
			}
		}
	}
	return new TextDecoder().decode(base64);
}

function decode(value: string, map: Uint16Array): Uint8Array {
	if (typeof value !== "string") {
		throw new TypeError();
	}
	const base64 = new TextEncoder().encode(value);
	let padding = 0;
	for (let i = value.length - 1; i >= 0; i--) {
		if (base64[i] === PAD_ASCII) {
			padding++;
		} else {
			break;
		}
	}
	const base64Length = value.length - padding;
	if (padding > 0 && ((value.length & 3) !== 0 || padding > 2)) {
		throw new DecodeBase64Error();
	}
	const partial = base64Length & 3;
	const byteLength = ((base64Length >>> 2) * 3) + (partial >>> 1) + (partial & 1);
	const bytes = new Uint8Array(byteLength);
	for (let i = 0, x = 0; i < byteLength;) {
		const a = map[base64[x++]];
		const b = map[base64[x++]];
		if (a === 0 || a === undefined || b === 0 || b === undefined) {
			throw new DecodeBase64Error();
		}
		bytes[i++] = (a << 2) | (b >>> 4);
		if (i < byteLength) {
			const c = map[base64[x++]];
			if (c === 0 || c === undefined) {
				throw new DecodeBase64Error();
			}
			bytes[i++] = (b << 4) | (c >>> 2);
			if (i < byteLength) {
				const d = map[base64[x++]];
				if (d === 0 || d === undefined) {
					throw new DecodeBase64Error();
				}
				bytes[i++] = (c << 6) | d;
			} else if ((c & 3) > 0) {
				throw new DecodeBase64Error();
			}
		} else if ((b & 7) > 0) {
			throw new DecodeBase64Error();
		}
	}
	return bytes;
}

export class DecodeBase64Error extends SyntaxError {}

/**
 * Base64 encode bytes.
 *
 * See RFC 3548 for more info.
 *
 * @param bytes The bytes to encode.
 * @param padding True, to include padding. Default is true.
 */
export function base64Encode(bytes: Bytes, padding = true): string {
	return encode(asUint8Array(bytes), BASE64_TO_ASCII, padding);
}

/**
 * Base64url encode bytes.
 *
 * See RFC 3548 for more info.
 *
 * @param bytes The bytes to encode.
 * @param padding True, to include padding. Default is false.
 */
export function base64UrlEncode(bytes: Bytes, padding = false): string {
	return encode(asUint8Array(bytes), BASE64URL_TO_ASCII, padding);
}

/**
 * Decode a base64 encoded text with optional trailing padding.
 *
 * See RFC 3548 for more info.
 *
 * @param value The text to decode.
 */
export function base64Decode(value: string): Uint8Array {
	return decode(value, ASCII_TO_BASE64);
}

/**
 * Decode a base64 url encoded text with optional trailing padding.
 *
 * This does ignore padding characters, but not concatenated base64url strings.
 *
 * See RFC 3548 for more info.
 *
 * @param value The text to decode.
 */
export function base64UrlDecode(value: string): Uint8Array {
	return decode(value, ASCII_TO_BASE64URL);
}
