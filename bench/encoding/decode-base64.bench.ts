import { Suite } from "benchmark";
import { decodeBase64 } from "../../src/encoding/base64";
import { getPseudoRandomBytes } from "../../test/_common/random-bytes";

export default function (suite: Suite) {
	for (const length of [
		100,
		1000,
		10000,
	]) {
		const data = Buffer.from(getPseudoRandomBytes(length)).toString("base64");

		suite.add(`${length} bytes`, () => {
			decodeBase64(data);
		});
	}
}
