import { base32Encode } from "@mxjp/binary";
import { strictEqual } from "assert";
import { test } from "node:test";

await test("base32", async () => {
	for (const [hex, base32] of [
		["", ""],
		["", ""],
		["12", "CI"],
		["1234", "CI2A"],
		["123456", "CI2FM"],
		["12345678", "CI2FM6A"],
		["123456789a", "CI2FM6E2"],
		["123456789abc", "CI2FM6E2XQ"],
		["2ad81a04447d744685e74a024abdec5617245cd8ec0822ab05e2bcce16fcd9c67d840f9827ece852dd347ff6f80fb89a10ae1d06a84f5213524aa6121f005c6f", "FLMBUBCEPV2ENBPHJIBEVPPMKYLSIXGY5QECFKYF4K6M4FX43HDH3BAPTAT6Z2CS3U2H75XYB64JUEFODUDKQT2SCNJEVJQSD4AFY3Y"],
	] as const) {
		const data = Buffer.from(hex, "hex");
		strictEqual(base32Encode(new Uint8Array(data)), base32);

		const padded = base32.padEnd(Math.ceil(base32.length / 8) * 8, "=");
		strictEqual(base32Encode(new Uint8Array(data), true), padded);
	}
});
