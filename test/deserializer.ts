import test, { ExecutionContext } from "ava";

import { Deserializer } from "../src/index.js";
import { Binary, binary } from "./_common/binary.js";

test("constructor (buffer, no offset, no length)", t => {
	const buffer = binary`010203`.buffer;
	const deserializer = new Deserializer(buffer);
	t.is(deserializer.byteOffset, 0);
	t.is(deserializer.bytesAvailable, 3);
	t.is(deserializer.uint8(), 0x01);
});

test("constructor (buffer, offset, no length", t => {
	const buffer = binary`010203`.buffer;
	const deserializer = new Deserializer(buffer, 1);
	t.is(deserializer.byteOffset, 1);
	t.is(deserializer.bytesAvailable, 2);
	t.is(deserializer.uint8(), 0x02);
});

test("constructor (buffer, no offset, length", t => {
	const buffer = binary`010203`.buffer;
	const deserializer = new Deserializer(buffer, undefined, 2);
	t.is(deserializer.byteOffset, 0);
	t.is(deserializer.bytesAvailable, 2);
	t.is(deserializer.uint8(), 0x01);
});

test("constructor (buffer, offset, length", t => {
	const buffer = binary`010203`.buffer;
	const deserializer = new Deserializer(buffer, 1, 1);
	t.is(deserializer.byteOffset, 1);
	t.is(deserializer.bytesAvailable, 1);
	t.is(deserializer.uint8(), 0x02);
});

test("constructor (array, no offset, no length)", t => {
	const buffer = binary`0001020300`.buffer;
	const array = new Uint8Array(buffer, 1, 3);
	const deserializer = new Deserializer(array);
	t.is(deserializer.byteOffset, 1);
	t.is(deserializer.bytesAvailable, 3);
	t.is(deserializer.uint8(), 0x01);
});

test("constructor (array, offset, no length)", t => {
	const buffer = binary`0001020300`.buffer;
	const array = new Uint8Array(buffer, 1, 3);
	const deserializer = new Deserializer(array, 1);
	t.is(deserializer.byteOffset, 2);
	t.is(deserializer.bytesAvailable, 2);
	t.is(deserializer.uint8(), 0x02);
});

test("constructor (array, no offset, length)", t => {
	const buffer = binary`0001020300`.buffer;
	const array = new Uint8Array(buffer, 1, 3);
	const deserializer = new Deserializer(array, undefined, 2);
	t.is(deserializer.byteOffset, 1);
	t.is(deserializer.bytesAvailable, 2);
	t.is(deserializer.uint8(), 0x01);
});

test("constructor (array, offset, length)", t => {
	const buffer = binary`0001020300`.buffer;
	const array = new Uint8Array(buffer, 1, 3);
	const deserializer = new Deserializer(array, 1, 1);
	t.is(deserializer.byteOffset, 2);
	t.is(deserializer.bytesAvailable, 1);
	t.is(deserializer.uint8(), 0x02);
});

test("buffer access", t => {
	const buffer = new ArrayBuffer(0);
	const deserializer = new Deserializer(buffer);
	t.is(deserializer.buffer, buffer);
});

test("push", t => {
	const deserializer = new Deserializer(binary`0102`.buffer);
	t.deepEqual(deserializer.buffer, binary`0102`.buffer);
	deserializer.push([
		binary`03`.array,
		binary`04`.array,
	]);
	t.is(deserializer.uint8(), 0x01);
	t.deepEqual(deserializer.buffer, binary`01020304`.buffer);
	t.is(deserializer.byteOffset, 1);
	t.is(deserializer.bytesAvailable, 3);
	t.is(deserializer.uint8(), 0x02);
	t.is(deserializer.uint8(), 0x03);
	t.is(deserializer.uint8(), 0x04);
});

test("checkpoint", t => {
	const deserializer = new Deserializer(binary`010203`.buffer);
	t.is(deserializer.uint8(), 0x01);
	const restore = deserializer.checkpoint();
	t.is(deserializer.uint8(), 0x02);
	t.is(deserializer.uint8(), 0x03);
	restore();
	t.is(deserializer.byteOffset, 1);
	t.is(deserializer.uint8(), 0x02);
});

const deserialize = test.macro({
	exec<T>(t: ExecutionContext, data: Binary, deserialize: (deserializer: Deserializer) => T, expected: T) {
		const deserializer = new Deserializer(binary`00${data.buffer}00`.buffer);
		deserializer.uint8();
		t.deepEqual(deserialize(deserializer), expected);
		t.is(deserializer.bytesAvailable, 1);
	},
	title(title) {
		return `deserialize: ${title}`;
	},
});

test(`${Deserializer.prototype.boolean.name} (true)`, deserialize, binary`01`, d => d.boolean(), true);
test(`${Deserializer.prototype.boolean.name} (false)`, deserialize, binary`00`, d => d.boolean(), false);

test(`${Deserializer.prototype.isSome.name} (some)`, deserialize, binary`01`, d => d.isSome(), true);
test(`${Deserializer.prototype.isSome.name} (none)`, deserialize, binary`00`, d => d.isSome(), false);

test(`${Deserializer.prototype.option.name} (none)`, deserialize, binary`00`, d => d.option(d => d.uint8()), undefined);
test(`${Deserializer.prototype.option.name} (some)`, deserialize, binary`0177`, d => d.option(d => d.uint8()), 0x77);

test(Deserializer.prototype.uint8.name, deserialize, binary`01`, d => d.uint8(), 0x01);

test(Deserializer.prototype.uint16.name, deserialize, binary`0102`, d => d.uint16(), 0x0102);
test(Deserializer.prototype.uint16le.name, deserialize, binary`0102`.reverse, d => d.uint16le(), 0x0102);

test(Deserializer.prototype.uint32.name, deserialize, binary`01020304`, d => d.uint32(), 0x01020304);
test(Deserializer.prototype.uint32le.name, deserialize, binary`01020304`.reverse, d => d.uint32le(), 0x01020304);

test(Deserializer.prototype.uint64.name, deserialize, binary`0102030405060708`, d => d.uint64(), 0x0102030405060708n);
test(Deserializer.prototype.uint64le.name, deserialize, binary`0102030405060708`.reverse, d => d.uint64le(), 0x0102030405060708n);

test(`${Deserializer.prototype.float32.name} (0)`, deserialize, binary`00000000`, d => d.float32(), 0);
test(`${Deserializer.prototype.float32.name} (-42.7)`, deserialize, binary`c22acccd`, d => d.float32(), -42.70000076293945);
test(`${Deserializer.prototype.float32.name} (NaN)`, deserialize, binary`7fc00000`, d => d.float32(), NaN);
test(`${Deserializer.prototype.float32.name} (Infinity)`, deserialize, binary`7f800000`, d => d.float32(), Infinity);
test(`${Deserializer.prototype.float32.name} (-Infinity)`, deserialize, binary`ff800000`, d => d.float32(), -Infinity);

test(`${Deserializer.prototype.float32le.name} (0)`, deserialize, binary`00000000`.reverse, d => d.float32le(), 0);
test(`${Deserializer.prototype.float32le.name} (-42.7)`, deserialize, binary`c22acccd`.reverse, d => d.float32le(), -42.70000076293945);
test(`${Deserializer.prototype.float32le.name} (NaN)`, deserialize, binary`7fc00000`.reverse, d => d.float32le(), NaN);
test(`${Deserializer.prototype.float32le.name} (Infinity)`, deserialize, binary`7f800000`.reverse, d => d.float32le(), Infinity);
test(`${Deserializer.prototype.float32le.name} (-Infinity)`, deserialize, binary`ff800000`.reverse, d => d.float32le(), -Infinity);

test(`${Deserializer.prototype.float64.name} (0)`, deserialize, binary`0000000000000000`, d => d.float64(), 0);
test(`${Deserializer.prototype.float64.name} (-42.7)`, deserialize, binary`c04559999999999a`, d => d.float64(), -42.7);
test(`${Deserializer.prototype.float64.name} (NaN)`, deserialize, binary`7ff80000000000000`, d => d.float64(), NaN);
test(`${Deserializer.prototype.float64.name} (Infinity)`, deserialize, binary`7ff00000000000000`, d => d.float64(), Infinity);
test(`${Deserializer.prototype.float64.name} (-Infinity)`, deserialize, binary`fff00000000000000`, d => d.float64(), -Infinity);

test(`${Deserializer.prototype.float64le.name} (0)`, deserialize, binary`0000000000000000`.reverse, d => d.float64le(), 0);
test(`${Deserializer.prototype.float64le.name} (-42.7)`, deserialize, binary`c04559999999999a`.reverse, d => d.float64le(), -42.7);
test(`${Deserializer.prototype.float64le.name} (NaN)`, deserialize, binary`7ff80000000000000`.reverse, d => d.float64le(), NaN);
test(`${Deserializer.prototype.float64le.name} (Infinity)`, deserialize, binary`7ff00000000000000`.reverse, d => d.float64le(), Infinity);
test(`${Deserializer.prototype.float64le.name} (-Infinity)`, deserialize, binary`fff00000000000000`.reverse, d => d.float64le(), -Infinity);

test(Deserializer.prototype.array.name, deserialize, binary`0102`, d => d.array(2), binary`0102`.array);
test(Deserializer.prototype.view.name, deserialize, binary`0102`, d => d.view(2), binary`0102`.view);
test(Deserializer.prototype.slice.name, deserialize, binary`0102`, d => d.slice(2), binary`0102`.buffer);
test(Deserializer.prototype.utf8.name, deserialize, binary`${"foo"}`, d => d.utf8(3), "foo");
