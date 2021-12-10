import { Suite } from "benchmark";
import { BASE58, BASE62, encodeBaseN } from "../../src/encoding/base-n";
import { getPseudoRandomBytes } from "../../test/_common/random-bytes";

export default function (suite: Suite) {
	for (const length of [
		5,
		50,
		500,
	]) {
		const data = Buffer.from(getPseudoRandomBytes(length));

		for (const alphabet of [
			BASE58,
			BASE62,
		]) {
			suite.add(`${length} bytes (base${alphabet.chars.length})`, () => {
				encodeBaseN(data, alphabet);
			});
		}
	}
}
