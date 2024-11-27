import { StreamDeserializer } from "@mpt/binary";
import { deepStrictEqual, strictEqual } from "node:assert";
import test, { suite } from "node:test";
import { binary } from "./common/binary.js";
import { createReadableChunks } from "./common/readable-chunks.js";

await suite("stream-deserializer", async () => {
	await test("basic", async t => {
		const stream = createReadableChunks([
			binary`03`.array,
			binary`${"foo"}0203`.array,
		]);

		const deserializer = new StreamDeserializer(stream);

		const events: unknown[] = [];

		const v1 = await deserializer.deserialize(d => {
			events.push("v1", d.bytesAvailable);
			return d.utf8(d.uint8());
		});
		strictEqual(v1, "foo");

		const v2 = await deserializer.deserialize(d => {
			events.push("v2", d.bytesAvailable);
			return d.uint16();
		});
		strictEqual(v2, 0x203);

		strictEqual(await deserializer.ended(), true);

		deepStrictEqual(events, [
			"v1",
			1,
			"v1",
			6,
			"v2",
			2,
		]);

		strictEqual(stream.locked, true);
		strictEqual(deserializer.releaseLock()?.bytesAvailable, 0);
		strictEqual(stream.locked, false);
	});

	await test(`${StreamDeserializer.prototype.deserialize.name} (require byte length)`, async t => {
		const deserializer = new StreamDeserializer(createReadableChunks([
			binary`01`.array,
			binary`0203`.array,
		]));

		const events: unknown[] = [];

		const v1 = await deserializer.deserialize(d => {
			events.push(d.bytesAvailable);
			return d.uint16();
		}, 2);
		strictEqual(v1, 0x102);

		deepStrictEqual(events, [3]);
	});

	await test(`${StreamDeserializer.prototype.deserialize.name} (require byte length, end of stream)`, async t => {
		const deserializer = new StreamDeserializer(createReadableChunks([
			binary`01`.array,
		]));
		await deserializer.deserialize(() => {}, 2).then(() => {
			throw new Error("unexpected resolve");
		}, () => {});
	});

	await test(`${StreamDeserializer.prototype.deserialize.name} (end of stream)`, async t => {
		const deserializer = new StreamDeserializer(createReadableChunks([
			binary`01`.array,
		]));
		await deserializer.deserialize(d => d.uint16()).then(() => {
			throw new Error("unexpected resolve");
		}, () => {});
	});

	await test(`${StreamDeserializer.prototype.deserialize.name} (delayed required byte length)`, async t => {
		const deserializer = new StreamDeserializer(createReadableChunks([
			binary`03`.array,
			binary`04`.array,
			binary`05`.array,
			binary`06`.array,
		]));

		const events: unknown[] = [];

		const v1 = await deserializer.deserialize((d, requireByteLength) => {
			events.push(d.bytesAvailable);

			const prefix = d.uint8();
			requireByteLength(1 + prefix);
			return d.slice(prefix);
		});

		deepStrictEqual(v1, binary`040506`.buffer);
		deepStrictEqual(events, [1, 4]);
	});

	await test(`${StreamDeserializer.prototype.releaseLock.name}`, async t => {
		const stream = createReadableChunks([
			binary`0102`.array,
		]);

		const deserializer = new StreamDeserializer(stream);

		const v1 = await deserializer.deserialize(d => d.uint8());
		strictEqual(v1, 0x01);

		strictEqual(await deserializer.ended(), false);

		const remaining = deserializer.releaseLock()!;
		deepStrictEqual(remaining.slice(remaining.bytesAvailable), binary`02`.buffer);
	});
});
