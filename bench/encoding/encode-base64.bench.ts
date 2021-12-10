import { Suite } from "benchmark";
import { encodeBase64 } from "../../src/encoding/base64";
import { getPseudoRandomBytes } from "../../test/_common/random-bytes";

export default function (suite: Suite) {
	for (const length of [
		100,
		1000,
		10000,
	]) {
		const data = getPseudoRandomBytes(length);
		suite.add(`${length} bytes`, () => {
			encodeBase64(data);
		});
	}
}
