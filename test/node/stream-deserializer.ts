import { Readable } from "node:stream";

import test from "ava";

import { StreamDeserializer } from "../../src/node/index.js";
import { binary } from "../_common/binary.js";

test("basic", async t => {
	const stream = new Readable({ read() {} });
	stream.push(binary`03${"f"}`.array);
	stream.push(binary`${"oo"}0203`.array);

	const deserializer = new StreamDeserializer(stream);

	const v1 = await deserializer.deserialize(d => {
		return d.utf8(d.uint8());
	});
	t.is(v1, "foo");

	const v2 = await deserializer.deserialize(d => {
		return d.uint16();
	});
	t.is(v2, 0x203);
});
