import { allocSync } from "../alloc.js";
import { asUint8Array, Bytes } from "../bytes.js";
import { TEXT_DECODER, TEXT_ENCODER } from "../shared-encoders.js";

const BASE32_TO_ASCII = TEXT_ENCODER.encode("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567");
const MASK = 0b11111;
const PAD_ASCII = "=".charCodeAt(0);

/**
 * Base32 encode bytes without padding.
 *
 * See RFC 3548 for more info.
 *
 * @param value The bytes to encode.
 * @param pad True, to include padding. Default is false.
 */
export function encodeBase32(value: Bytes, pad = false): string {
	const array = asUint8Array(value);
	const rest = array.byteLength % 5;
	const comp = array.byteLength - rest;
	const base32Length = pad ? Math.ceil(array.byteLength / 5) * 8 : Math.ceil(array.byteLength / 5 * 8);
	const base32 = new Uint8Array(allocSync(base32Length), 0, base32Length);
	let b = 0;
	for (let i = 0; i < comp; i += 5) {
		base32[b++] = BASE32_TO_ASCII[array[i] >>> 3];
		base32[b++] = BASE32_TO_ASCII[((array[i] << 2) & MASK) | (array[i + 1] >>> 6)];
		base32[b++] = BASE32_TO_ASCII[((array[i + 1] >>> 1) & MASK)];
		base32[b++] = BASE32_TO_ASCII[((array[i + 1] << 4) & MASK) | (array[i + 2] >>> 4)];
		base32[b++] = BASE32_TO_ASCII[((array[i + 2] << 1) & MASK) | (array[i + 3] >>> 7)];
		base32[b++] = BASE32_TO_ASCII[((array[i + 3] >>> 2) & MASK)];
		base32[b++] = BASE32_TO_ASCII[((array[i + 3] << 3) & MASK) | (array[i + 4] >>> 5)];
		base32[b++] = BASE32_TO_ASCII[array[i + 4] & MASK];
	}
	if (rest > 0) {
		base32[b++] = BASE32_TO_ASCII[array[comp] >>> 3];
		if (rest > 1) {
			base32[b++] = BASE32_TO_ASCII[((array[comp] << 2) & MASK) | (array[comp + 1] >>> 6)];
			base32[b++] = BASE32_TO_ASCII[(array[comp + 1] >>> 1) & MASK];
			if (rest > 2) {
				base32[b++] = BASE32_TO_ASCII[((array[comp + 1] << 4) & MASK) | (array[comp + 2] >>> 4)];
				if (rest > 3) {
					base32[b++] = BASE32_TO_ASCII[((array[comp + 2] << 1) & MASK) | (array[comp + 3] >>> 7)];
					base32[b++] = BASE32_TO_ASCII[(array[comp + 3] >>> 2) & MASK];
					base32[b++] = BASE32_TO_ASCII[(array[comp + 3] << 3) & MASK];
				} else {
					base32[b++] = BASE32_TO_ASCII[(array[comp + 2] << 1) & MASK];
				}
			} else {
				base32[b++] = BASE32_TO_ASCII[(array[comp + 1] << 4) & MASK];
			}
		} else {
			base32[b++] = BASE32_TO_ASCII[(array[comp] << 2) & MASK];
		}
		base32.fill(PAD_ASCII, b);
	}
	return TEXT_DECODER.decode(base32);
}
