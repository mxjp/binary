import { Suite } from "benchmark";

import { decodeHex } from "../../src/index.js";
import { getPseudoRandomBytes } from "../../test/_common/random-bytes.js";

export default function (suite: Suite): void {
	for (const length of [
		100,
		1000,
		10000,
	]) {
		const data = Buffer.from(getPseudoRandomBytes(length)).toString("hex");

		suite.add(`${length} bytes`, () => {
			decodeHex(data);
		});
	}
}
