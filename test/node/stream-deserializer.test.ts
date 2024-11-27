import { StreamDeserializer } from "@mpt/binary/node";
import { strictEqual } from "node:assert";
import { Readable } from "node:stream";
import test from "node:test";
import { binary } from "../common/binary.js";

await test("node/stream-deserializer", async t => {
	const stream = new Readable({ read() {} });
	stream.push(binary`03${"f"}`.array);
	stream.push(binary`${"oo"}0203`.array);

	const deserializer = new StreamDeserializer(stream);

	const v1 = await deserializer.deserialize(d => {
		return d.utf8(d.uint8());
	});
	strictEqual(v1, "foo");

	const v2 = await deserializer.deserialize(d => {
		return d.uint16();
	});
	strictEqual(v2, 0x203);
});
