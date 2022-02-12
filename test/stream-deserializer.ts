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

	const v1 = await deserializer.deserialize(d => {
		events.push("v1", d.bytesAvailable);
		return d.utf8(d.uint8());
	});
	t.is(v1, "foo");

	const v2 = await deserializer.deserialize(d => {
		events.push("v2", d.bytesAvailable);
		return d.uint16();
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

	const v1 = await deserializer.deserialize(d => {
		events.push(d.bytesAvailable);
		return d.uint16();
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
	await t.throwsAsync(() => deserializer.deserialize(d => d.uint16()));
});

test(`${StreamDeserializer.prototype.deserialize.name} (delayed required byte length)`, async t => {
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

	t.deepEqual(v1, binary`040506`.buffer);
	t.deepEqual(events, [1, 4]);
});

test(`${StreamDeserializer.prototype.releaseLock.name}`, async t => {
	const stream = createReadableChunks([
		binary`0102`.array,
	]);

	const deserializer = new StreamDeserializer(stream);

	const v1 = await deserializer.deserialize(d => d.uint8());
	t.is(v1, 0x01);

	t.false(await deserializer.ended());

	const remaining = deserializer.releaseLock()!;
	t.deepEqual(remaining.slice(remaining.bytesAvailable), binary`02`.buffer);
});
