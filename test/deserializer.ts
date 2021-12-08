import test, { CbMacro, ExecutionContext } from "ava";
import { Deserializer } from "../src";
import { Binary, binary } from "./_common/binary";

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

function deserialize<T>(t: ExecutionContext, data: Binary, deserialize: (deserializer: Deserializer) => T, expected: T) {
	const deserializer = new Deserializer(binary`00${data.buffer}00`.buffer);
	deserializer.uint8();
	t.deepEqual(deserialize(deserializer), expected);
	t.is(deserializer.bytesAvailable, 1);
}

(deserialize as CbMacro<any>).title = title => `deserialize: ${title}`;

test(Deserializer.prototype.uint8.name, deserialize, binary`01`, d => d.uint8(), 0x01);
test(Deserializer.prototype.uint16.name, deserialize, binary`0102`, d => d.uint16(), 0x0102);
test(Deserializer.prototype.uint32.name, deserialize, binary`01020304`, d => d.uint32(), 0x01020304);
test(Deserializer.prototype.array.name, deserialize, binary`0102`, d => d.array(2), binary`0102`.array);
test(Deserializer.prototype.view.name, deserialize, binary`0102`, d => d.view(2), binary`0102`.view);
test(Deserializer.prototype.slice.name, deserialize, binary`0102`, d => d.slice(2), binary`0102`.buffer);
test(Deserializer.prototype.utf8.name, deserialize, binary`${"foo"}`, d => d.utf8(3), "foo");
