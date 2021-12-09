import { Suite } from "benchmark";
import { decodeHex } from "../../src";
import { getPseudoRandomBytes } from "../../test/_common/random-bytes";

export default function (suite: Suite) {
	for (const length of [
		100,
		1000,
		10000,
	]) {
		const data = Buffer.from(getPseudoRandomBytes(length)).toString("hex");
		const buffer = new Uint8Array(20000);

		suite.add(`${length} bytes (alloc buffer)`, () => {
			decodeHex(data);
		});

		suite.add(`${length} bytes (reuse buffer)`, () => {
			decodeHex(data, buffer);
		});
	}
}
