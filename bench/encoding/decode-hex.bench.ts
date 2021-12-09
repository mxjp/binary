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

		suite.add(`${length} bytes`, () => {
			decodeHex(data);
		});
	}
}
