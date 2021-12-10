import { Suite } from "benchmark";
import { BASE58, BASE62, decodeBaseN, encodeBaseN } from "../../src/encoding/base-n";
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
			const encoded = encodeBaseN(data, alphabet, undefined, 500);
			suite.add(`${length} bytes (base${alphabet.chars.length})`, () => {
				decodeBaseN(encoded, alphabet, 500);
			});
		}
	}
}
