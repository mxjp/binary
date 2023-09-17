import type { Suite } from "benchmark";

import { Serializer } from "../src/index.js";

export default function (suite: Suite): void {
	function serialize() {
		const s = new Serializer();
		s.uint8(42);
		s.uint16(0x1234);
		s.uint32le(0x11223344);
		s.prefixedUTF8(s.uint16, "Hello World!");
		s.float64(-42.7);
		return s.serialize();
	}

	suite.add(`${serialize().byteLength} arbitrary bytes`, serialize);

	const parts = 1000;
	suite.add(`${parts} uint8 parts`, () => {
		const serializer = new Serializer();
		for (let i = 0; i < parts; i++) {
			serializer.uint8(0x42);
		}
	});
}
