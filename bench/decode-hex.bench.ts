import { decodeHex } from "@mpt/binary";
import type { Suite } from "benchmark";
import { getPseudoRandomBytes } from "./common.js";

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
