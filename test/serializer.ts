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
test(Serializer.prototype.uint16le.name, serialize, s => s.uint16le(0x1234), binary`1234`.reverse);

test(Serializer.prototype.uint32.name, serialize, s => s.uint32(0x12345678), binary`12345678`);
test(Serializer.prototype.uint32le.name, serialize, s => s.uint32le(0x12345678), binary`12345678`.reverse);

test(Serializer.prototype.uint64.name, serialize, s => s.uint64(0x0123456789abcdefn), binary`0123456789abcdef`);
test(Serializer.prototype.uint64le.name, serialize, s => s.uint64le(0x0123456789abcdefn), binary`0123456789abcdef`.reverse);

test(`${Serializer.prototype.float32.name} (0)`, serialize, s => s.float32(0), binary`00000000`);
test(`${Serializer.prototype.float32.name} (-42.7)`, serialize, s => s.float32(-42.7), binary`c22acccd`);
test(`${Serializer.prototype.float32.name} (NaN)`, serialize, s => s.float32(NaN), binary`7fc00000`);
test(`${Serializer.prototype.float32.name} (Infinity)`, serialize, s => s.float32(Infinity), binary`7f800000`);
test(`${Serializer.prototype.float32.name} (-Infinity)`, serialize, s => s.float32(-Infinity), binary`ff800000`);

test(`${Serializer.prototype.float32le.name} (0)`, serialize, s => s.float32le(0), binary`00000000`.reverse);
test(`${Serializer.prototype.float32le.name} (-42.7)`, serialize, s => s.float32le(-42.7), binary`c22acccd`.reverse);
test(`${Serializer.prototype.float32le.name} (NaN)`, serialize, s => s.float32le(NaN), binary`7fc00000`.reverse);
test(`${Serializer.prototype.float32le.name} (Infinity)`, serialize, s => s.float32le(Infinity), binary`7f800000`.reverse);
test(`${Serializer.prototype.float32le.name} (-Infinity)`, serialize, s => s.float32le(-Infinity), binary`ff800000`.reverse);

test(`${Serializer.prototype.float64.name} (0)`, serialize, s => s.float64(0), binary`0000000000000000`);
test(`${Serializer.prototype.float64.name} (-42.7)`, serialize, s => s.float64(-42.7), binary`c04559999999999a`);
test(`${Serializer.prototype.float64.name} (NaN)`, serialize, s => s.float64(NaN), binary`7ff80000000000000`);
test(`${Serializer.prototype.float64.name} (Infinity)`, serialize, s => s.float64(Infinity), binary`7ff00000000000000`);
test(`${Serializer.prototype.float64.name} (-Infinity)`, serialize, s => s.float64(-Infinity), binary`fff00000000000000`);

test(`${Serializer.prototype.float64le.name} (0)`, serialize, s => s.float64le(0), binary`0000000000000000`.reverse);
test(`${Serializer.prototype.float64le.name} (-42.7)`, serialize, s => s.float64le(-42.7), binary`c04559999999999a`.reverse);
test(`${Serializer.prototype.float64le.name} (NaN)`, serialize, s => s.float64le(NaN), binary`7ff80000000000000`.reverse);
test(`${Serializer.prototype.float64le.name} (Infinity)`, serialize, s => s.float64le(Infinity), binary`7ff00000000000000`.reverse);
test(`${Serializer.prototype.float64le.name} (-Infinity)`, serialize, s => s.float64le(-Infinity), binary`fff00000000000000`.reverse);

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
