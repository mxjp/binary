import type { Suite } from "benchmark";

import { Deserializer, Serializer } from "../../src/index.js";

export default function (suite: Suite): void {
	const data = Serializer.serialize(s => {
		s.uint8(42);
		s.uint16(0x1234);
		s.uint32le(0x11223344);
		s.prefixedUTF8(s.uint16, "Hello World!");
		s.float64(-42.7);
	});

	suite.add(`${data.byteLength} arbitrary bytes`, () => {
		const d = new Deserializer(data);
		d.uint8();
		d.uint16();
		d.uint32le();
		d.utf8(d.uint16());
		d.float64();
	});
}
