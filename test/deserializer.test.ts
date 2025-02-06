import { Deserializer } from "@mpt/binary";
import { deepStrictEqual, strictEqual } from "node:assert";
import test, { suite } from "node:test";
import { binary } from "./common/binary.js";

await suite("deserializer", async () => {
	await test("constructor (buffer, no offset, no length)", t => {
		const buffer = binary`010203`.buffer;
		const deserializer = new Deserializer(buffer);
		strictEqual(deserializer.byteOffset, 0);
		strictEqual(deserializer.bytesAvailable, 3);
		strictEqual(deserializer.uint8(), 0x01);
	});

	await test("constructor (buffer, offset, no length", t => {
		const buffer = binary`010203`.buffer;
		const deserializer = new Deserializer(buffer, 1);
		strictEqual(deserializer.byteOffset, 1);
		strictEqual(deserializer.bytesAvailable, 2);
		strictEqual(deserializer.uint8(), 0x02);
	});

	await test("constructor (buffer, no offset, length", t => {
		const buffer = binary`010203`.buffer;
		const deserializer = new Deserializer(buffer, undefined, 2);
		strictEqual(deserializer.byteOffset, 0);
		strictEqual(deserializer.bytesAvailable, 2);
		strictEqual(deserializer.uint8(), 0x01);
	});

	await test("constructor (buffer, offset, length", t => {
		const buffer = binary`010203`.buffer;
		const deserializer = new Deserializer(buffer, 1, 1);
		strictEqual(deserializer.byteOffset, 1);
		strictEqual(deserializer.bytesAvailable, 1);
		strictEqual(deserializer.uint8(), 0x02);
	});

	await test("constructor (array, no offset, no length)", t => {
		const buffer = binary`0001020300`.buffer;
		const array = new Uint8Array(buffer, 1, 3);
		const deserializer = new Deserializer(array);
		strictEqual(deserializer.byteOffset, 1);
		strictEqual(deserializer.bytesAvailable, 3);
		strictEqual(deserializer.uint8(), 0x01);
	});

	await test("constructor (array, offset, no length)", t => {
		const buffer = binary`0001020300`.buffer;
		const array = new Uint8Array(buffer, 1, 3);
		const deserializer = new Deserializer(array, 1);
		strictEqual(deserializer.byteOffset, 2);
		strictEqual(deserializer.bytesAvailable, 2);
		strictEqual(deserializer.uint8(), 0x02);
	});

	await test("constructor (array, no offset, length)", t => {
		const buffer = binary`0001020300`.buffer;
		const array = new Uint8Array(buffer, 1, 3);
		const deserializer = new Deserializer(array, undefined, 2);
		strictEqual(deserializer.byteOffset, 1);
		strictEqual(deserializer.bytesAvailable, 2);
		strictEqual(deserializer.uint8(), 0x01);
	});

	await test("constructor (array, offset, length)", t => {
		const buffer = binary`0001020300`.buffer;
		const array = new Uint8Array(buffer, 1, 3);
		const deserializer = new Deserializer(array, 1, 1);
		strictEqual(deserializer.byteOffset, 2);
		strictEqual(deserializer.bytesAvailable, 1);
		strictEqual(deserializer.uint8(), 0x02);
	});

	await test("buffer access", t => {
		const buffer = new ArrayBuffer(0);
		const deserializer = new Deserializer(buffer);
		strictEqual(deserializer.buffer, buffer);
	});

	await test("push", t => {
		const deserializer = new Deserializer(binary`0102`.buffer);
		deepStrictEqual(deserializer.buffer, binary`0102`.buffer);
		deserializer.push([
			binary`03`.array,
			binary`04`.array,
		]);
		strictEqual(deserializer.uint8(), 0x01);
		deepStrictEqual(deserializer.buffer, binary`01020304`.buffer);
		strictEqual(deserializer.byteOffset, 1);
		strictEqual(deserializer.bytesAvailable, 3);
		strictEqual(deserializer.uint8(), 0x02);
		strictEqual(deserializer.uint8(), 0x03);
		strictEqual(deserializer.uint8(), 0x04);
	});

	await test("checkpoint", t => {
		const deserializer = new Deserializer(binary`010203`.buffer);
		strictEqual(deserializer.uint8(), 0x01);
		const restore = deserializer.checkpoint();
		strictEqual(deserializer.uint8(), 0x02);
		strictEqual(deserializer.uint8(), 0x03);
		restore();
		strictEqual(deserializer.byteOffset, 1);
		strictEqual(deserializer.uint8(), 0x02);
	});

	for (const [name, data, deserialize, expected] of [
		[`${Deserializer.prototype.boolean.name} (true)`, binary`01`, (d: Deserializer) => d.boolean(), true],
		[`${Deserializer.prototype.boolean.name} (false)`, binary`00`, (d: Deserializer) => d.boolean(), false],

		[`${Deserializer.prototype.isSome.name} (some)`, binary`01`, (d: Deserializer) => d.isSome(), true],
		[`${Deserializer.prototype.isSome.name} (none)`, binary`00`, (d: Deserializer) => d.isSome(), false],

		[`${Deserializer.prototype.option.name} (none)`, binary`00`, (d: Deserializer) => d.option((d: Deserializer) => d.uint8()), undefined],
		[`${Deserializer.prototype.option.name} (some)`, binary`0177`, (d: Deserializer) => d.option((d: Deserializer) => d.uint8()), 0x77],

		[Deserializer.prototype.uint8.name, binary`01`, (d: Deserializer) => d.uint8(), 0x01],

		[Deserializer.prototype.uint16.name, binary`0102`, (d: Deserializer) => d.uint16(), 0x0102],
		[Deserializer.prototype.uint16le.name, binary`0102`.reverse, (d: Deserializer) => d.uint16le(), 0x0102],

		[Deserializer.prototype.uint32.name, binary`01020304`, (d: Deserializer) => d.uint32(), 0x01020304],
		[Deserializer.prototype.uint32le.name, binary`01020304`.reverse, (d: Deserializer) => d.uint32le(), 0x01020304],

		[Deserializer.prototype.uint64.name, binary`0102030405060708`, (d: Deserializer) => d.uint64(), 0x0102030405060708n],
		[Deserializer.prototype.uint64le.name, binary`0102030405060708`.reverse, (d: Deserializer) => d.uint64le(), 0x0102030405060708n],

		[`${Deserializer.prototype.float32.name} (0)`, binary`00000000`, (d: Deserializer) => d.float32(), 0],
		[`${Deserializer.prototype.float32.name} (-42.7)`, binary`c22acccd`, (d: Deserializer) => d.float32(), -42.70000076293945],
		[`${Deserializer.prototype.float32.name} (NaN)`, binary`7fc00000`, (d: Deserializer) => d.float32(), NaN],
		[`${Deserializer.prototype.float32.name} (Infinity)`, binary`7f800000`, (d: Deserializer) => d.float32(), Infinity],
		[`${Deserializer.prototype.float32.name} (-Infinity)`, binary`ff800000`, (d: Deserializer) => d.float32(), -Infinity],

		[`${Deserializer.prototype.float32le.name} (0)`, binary`00000000`.reverse, (d: Deserializer) => d.float32le(), 0],
		[`${Deserializer.prototype.float32le.name} (-42.7)`, binary`c22acccd`.reverse, (d: Deserializer) => d.float32le(), -42.70000076293945],
		[`${Deserializer.prototype.float32le.name} (NaN)`, binary`7fc00000`.reverse, (d: Deserializer) => d.float32le(), NaN],
		[`${Deserializer.prototype.float32le.name} (Infinity)`, binary`7f800000`.reverse, (d: Deserializer) => d.float32le(), Infinity],
		[`${Deserializer.prototype.float32le.name} (-Infinity)`, binary`ff800000`.reverse, (d: Deserializer) => d.float32le(), -Infinity],

		[`${Deserializer.prototype.float64.name} (0)`, binary`0000000000000000`, (d: Deserializer) => d.float64(), 0],
		[`${Deserializer.prototype.float64.name} (-42.7)`, binary`c04559999999999a`, (d: Deserializer) => d.float64(), -42.7],
		[`${Deserializer.prototype.float64.name} (NaN)`, binary`7ff80000000000000`, (d: Deserializer) => d.float64(), NaN],
		[`${Deserializer.prototype.float64.name} (Infinity)`, binary`7ff00000000000000`, (d: Deserializer) => d.float64(), Infinity],
		[`${Deserializer.prototype.float64.name} (-Infinity)`, binary`fff00000000000000`, (d: Deserializer) => d.float64(), -Infinity],

		[`${Deserializer.prototype.float64le.name} (0)`, binary`0000000000000000`.reverse, (d: Deserializer) => d.float64le(), 0],
		[`${Deserializer.prototype.float64le.name} (-42.7)`, binary`c04559999999999a`.reverse, (d: Deserializer) => d.float64le(), -42.7],
		[`${Deserializer.prototype.float64le.name} (NaN)`, binary`7ff80000000000000`.reverse, (d: Deserializer) => d.float64le(), NaN],
		[`${Deserializer.prototype.float64le.name} (Infinity)`, binary`7ff00000000000000`.reverse, (d: Deserializer) => d.float64le(), Infinity],
		[`${Deserializer.prototype.float64le.name} (-Infinity)`, binary`fff00000000000000`.reverse, (d: Deserializer) => d.float64le(), -Infinity],

		[Deserializer.prototype.viewArray.name, binary`0102`, (d: Deserializer) => d.viewArray(2), binary`0102`.array],
		[Deserializer.prototype.viewData.name, binary`0102`, (d: Deserializer) => d.viewData(2), binary`0102`.view],
		[Deserializer.prototype.copy.name, binary`0102`, (d: Deserializer) => d.copy(2), binary`0102`.buffer],
		[Deserializer.prototype.utf8.name, binary`${"foo"}`, (d: Deserializer) => d.utf8(3), "foo"],
	] as const) {
		await test(name, () => {
			const deserializer = new Deserializer(binary`00${data.buffer}00`.buffer);
			deserializer.uint8();
			deepStrictEqual(deserialize(deserializer), expected);
			strictEqual(deserializer.bytesAvailable, 1);
		});
	}
});
