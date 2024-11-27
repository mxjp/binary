import { encodeBase32 } from "@mpt/binary";
import { strictEqual } from "assert";
import { suite } from "node:test";
import { binary } from "../common/binary.js";

await suite("encoding/base32", async () => {
	for (const [data, output] of [
		[binary``, ""],
		[binary``, ""],
		[binary`12`, "CI"],
		[binary`1234`, "CI2A"],
		[binary`123456`, "CI2FM"],
		[binary`12345678`, "CI2FM6A"],
		[binary`123456789a`, "CI2FM6E2"],
		[binary`123456789abc`, "CI2FM6E2XQ"],
		[binary`2ad81a04447d744685e74a024abdec5617245cd8ec0822ab05e2bcce16fcd9c67d840f9827ece852dd347ff6f80fb89a10ae1d06a84f5213524aa6121f005c6f`, "FLMBUBCEPV2ENBPHJIBEVPPMKYLSIXGY5QECFKYF4K6M4FX43HDH3BAPTAT6Z2CS3U2H75XYB64JUEFODUDKQT2SCNJEVJQSD4AFY3Y"],
	] as const) {
		strictEqual(encodeBase32(data.array), output);
		strictEqual(encodeBase32(data.buffer), output);
		strictEqual(encodeBase32(data.nodeBuffer), output);

		const paddedOutput = output.padEnd(Math.ceil(output.length / 8) * 8, "=");
		strictEqual(encodeBase32(data.array, true), paddedOutput);
		strictEqual(encodeBase32(data.buffer, true), paddedOutput);
	}
});
