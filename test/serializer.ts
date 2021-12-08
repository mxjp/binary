import test, { CbMacro, ExecutionContext,  } from "ava";
import { Serializer } from "../src";
import { Binary, binary } from "./_common/binary";

test(`${Serializer.prototype.append.name} / ${Serializer.prototype.serialize.name}`, t => {
	const serializer = new Serializer();

	serializer.append(0, () => {});
	t.is(serializer.byteLength, 0);
	t.deepEqual(serializer.serialize(), binary``.buffer);

	serializer.append(3, (ctx, value) => {
		t.is(ctx.byteOffset, 0);
		t.is(value, 0x42);
		ctx.view.setUint8(ctx.byteOffset + 2, value);
	}, 0x42);
	t.is(serializer.byteLength, 3);
	t.deepEqual(serializer.serialize(), binary`000042`.buffer);

	serializer.append(3, (ctx, value) => {
		t.is(ctx.byteOffset, 3);
		t.is(value, "foo");
		ctx.array.set(new TextEncoder().encode(value), ctx.byteOffset);
	}, "foo");
	t.is(serializer.byteLength, 6);
	t.deepEqual(serializer.serialize(), binary`000042${"foo"}`.buffer);
});

function serialize(t: ExecutionContext, fn: Serializer.SerializableFn, expected: Binary) {
	const serializer = new Serializer();
	serializer.append(1, () => {});
	fn(serializer);
	serializer.append(1, () => {});
	t.deepEqual(serializer.serialize(), binary`00${expected.buffer}00`.buffer);
}

(serialize as CbMacro<any>).title = title => `serialize: ${title}`;

test(Serializer.prototype.uint8.name, serialize, s => s.uint8(0x42), binary`42`);
test(Serializer.prototype.uint16.name, serialize, s => s.uint16(0x1234), binary`1234`);
test(Serializer.prototype.uint32.name, serialize, s => s.uint32(0x12345678), binary`12345678`);
test(Serializer.prototype.bytes.name, serialize, s => s.bytes(binary`0123`.buffer), binary`0123`);
test(Serializer.prototype.utf8.name, serialize, s => s.utf8("Hello World!"), binary`${"Hello World!"}`);
test(Serializer.prototype.prefixedBytes.name, serialize, s => s.prefixedBytes(s.uint8, binary`0123`.buffer), binary`020123`);
test(Serializer.prototype.prefixedUTF8.name, serialize, s => s.prefixedUTF8(s.uint8, "Hello World!"), binary`0c${"Hello World!"}`);

test(`${Serializer.serialize.name} (function)`, t => {
	t.deepEqual(Serializer.serialize(w => {
		w.uint8(0x42);
	}), binary`42`.buffer);
});

test(`${Serializer.serialize.name} (object)`, t => {
	t.deepEqual(Serializer.serialize({
		serialize(serializer) {
			serializer.uint8(0x42);
		},
	}), binary`42`.buffer);
});

test(`${Serializer.serialize.name} (prefer function)`, t => {
	t.deepEqual(Serializer.serialize(Object.assign((serializer: Serializer) => {
		serializer.uint8(0x42);
	}, {
		serialize(serializer: Serializer) {
			serializer.uint8(0x84);
		},
	})), binary`42`.buffer);
});
