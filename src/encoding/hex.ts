import { asUint8Array, Bytes } from "../bytes.js";
import { getSyncSharedBuffer } from "../shared-buffers.js";
import { TEXT_DECODER, TEXT_ENCODER } from "../shared-encoders.js";

const BYTE_TO_HEX_ASCII_L = new Uint16Array(256);
const BYTE_TO_HEX_ASCII_U = new Uint16Array(256);
const HEX_ASCII_TO_BYTE = new Uint16Array(26215);

{
	const lowerCase = (value: number) => value > 9 ? 0x57 + value : 0x30 + value;
	const upperCase = (value: number) => value > 9 ? 0x37 + value : 0x30 + value;
	for (let i = 0; i < 256; i++) {
		const ll = (lowerCase(i >> 4) << 8) | lowerCase(i & 0xF);
		const lu = (lowerCase(i >> 4) << 8) | upperCase(i & 0xF);
		const ul = (upperCase(i >> 4) << 8) | lowerCase(i & 0xF);
		const uu = (upperCase(i >> 4) << 8) | upperCase(i & 0xF);

		BYTE_TO_HEX_ASCII_L[i] = ll;
		BYTE_TO_HEX_ASCII_U[i] = uu;

		HEX_ASCII_TO_BYTE[ll] = i | 0x100;
		HEX_ASCII_TO_BYTE[lu] = i | 0x100;
		HEX_ASCII_TO_BYTE[ul] = i | 0x100;
		HEX_ASCII_TO_BYTE[uu] = i | 0x100;
	}
}

/**
 * Hex encode bytes.
 *
 * @param value The bytes to encode.
 * @param upperCase If true, upper case encoding is used, else lower case.
 */
export function encodeHex(value: Bytes, upperCase = false): string {
	const bytes = asUint8Array(value);
	const byteToHexAscii = upperCase ? BYTE_TO_HEX_ASCII_U : BYTE_TO_HEX_ASCII_L;
	const bufferLength = bytes.byteLength << 1;
	const buffer = getSyncSharedBuffer(bufferLength);
	const view = new DataView(buffer, 0, bufferLength);
	for (let i = 0; i < bytes.byteLength; i++) {
		view.setUint16(i << 1, byteToHexAscii[bytes[i]]);
	}
	return TEXT_DECODER.decode(new Uint8Array(buffer, 0, bufferLength));
}

/**
 * Decode hex encoded text.
 *
 * @param value The text to decode.
 * @returns The decoded bytes.
 */
export function decodeHex(value: string): Uint8Array {
	const byteLength = value.length / 2;
	if (!Number.isInteger(byteLength)) {
		throw new TypeError("invalid hex data");
	}
	const bytes = new Uint8Array(byteLength);

	const buffer = getSyncSharedBuffer(value.length);
	const chars = new Uint8Array(buffer);
	TEXT_ENCODER.encodeInto(value, chars);

	const view = new DataView(buffer);
	for (let i = 0; i < byteLength; i++) {
		const byte = HEX_ASCII_TO_BYTE[view.getUint16(i << 1, false)];
		if (byte === 0 || byte === undefined) {
			throw new TypeError("invalid hex data");
		}
		bytes[i] = byte;
	}
	return bytes;
}
