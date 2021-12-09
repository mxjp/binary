import { Suite } from "benchmark";
import { encodeHex } from "../../src";
import { getPseudoRandomBytes } from "../../test/_common/random-bytes";

export default function (suite: Suite) {
	for (const length of [
		100,
		1000,
		10000,
	]) {
		const data = getPseudoRandomBytes(length);
		suite.add(`${length} bytes`, () => {
			encodeHex(data);
		});
	}
}
