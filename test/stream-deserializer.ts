import test from "ava";
import { StreamDeserializer } from "../src";
import { binary } from "./_common/binary";
import { createReadableChunks } from "./_common/readable-chunks";

test("basic", async t => {
	const stream = createReadableChunks([
		binary`03`.array,
		binary`${"foo"}0203`.array,
	]);

	const deserializer = new StreamDeserializer(stream);

	const events: unknown[] = [];

	const v1 = await deserializer.deserialize(deserializer => {
		events.push("v1", deserializer.bytesAvailable);
		return deserializer.utf8(deserializer.uint8());
	});
	t.is(v1, "foo");

	const v2 = await deserializer.deserialize(deserializer => {
		events.push("v2", deserializer.bytesAvailable);
		return deserializer.uint16();
	});
	t.is(v2, 0x203);

	t.true(await deserializer.ended());

	t.deepEqual(events, [
		"v1", 1,
		"v1", 6,
		"v2", 2,
	]);

	t.true(stream.locked);
	t.is(deserializer.releaseLock()?.bytesAvailable, 0);
	t.false(stream.locked);
});

test(`${StreamDeserializer.prototype.deserialize.name} (require byte length)`, async t => {
	const deserializer = new StreamDeserializer(createReadableChunks([
		binary`01`.array,
		binary`0203`.array,
	]));

	const events: unknown[] = [];

	const v1 = await deserializer.deserialize(deserializer => {
		events.push(deserializer.bytesAvailable);
		return deserializer.uint16();
	}, 2);
	t.is(v1, 0x102);

	t.deepEqual(events, [3]);
});

test(`${StreamDeserializer.prototype.deserialize.name} (require byte length, end of stream)`, async t => {
	const deserializer = new StreamDeserializer(createReadableChunks([
		binary`01`.array,
	]));
	await t.throwsAsync(() => deserializer.deserialize(() => t.fail(), 2));
});

test(`${StreamDeserializer.prototype.deserialize.name} (end of stream)`, async t => {
	const deserializer = new StreamDeserializer(createReadableChunks([
		binary`01`.array,
	]));
	await t.throwsAsync(() => deserializer.deserialize(deserializer => deserializer.uint16()));
});

test(`${StreamDeserializer.prototype.deserialize.name} (delayed required byte length)`, async t => {
	const deserializer = new StreamDeserializer(createReadableChunks([
		binary`03`.array,
		binary`04`.array,
		binary`05`.array,
		binary`06`.array,
	]));

	const events: unknown[] = [];

	const v1 = await deserializer.deserialize((deserializer, requireByteLength) => {
		events.push(deserializer.bytesAvailable);

		const prefix = deserializer.uint8();
		requireByteLength(1 + prefix);
		return deserializer.slice(prefix);
	});

	t.deepEqual(v1, binary`040506`.buffer);
	t.deepEqual(events, [1, 4]);
});

test(`${StreamDeserializer.prototype.releaseLock.name}`, async t => {
	const stream = createReadableChunks([
		binary`0102`.array,
	]);

	const deserializer = new StreamDeserializer(stream);

	const v1 = await deserializer.deserialize(deserializer => deserializer.uint8());
	t.is(v1, 0x01);

	t.false(await deserializer.ended());

	const remaining = deserializer.releaseLock()!;
	t.deepEqual(remaining.slice(remaining.bytesAvailable), binary`02`.buffer);
});
