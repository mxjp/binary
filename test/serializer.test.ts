import { Serializer } from "@mpt/binary";
import { deepStrictEqual, strictEqual } from "node:assert";
import test, { suite } from "node:test";
import { binary } from "./common/binary.js";

await suite("serializer", async () => {
	await test(`${Serializer.prototype.append.name} / ${Serializer.prototype.serialize.name}`, t => {
		const serializer = new Serializer();

		serializer.append(0, () => {});
		strictEqual(serializer.byteLength, 0);
		deepStrictEqual(serializer.serialize(), binary``.buffer);

		serializer.append(3, (ctx, value) => {
			strictEqual(ctx.byteOffset, 0);
			strictEqual(value, 0x42);
			ctx.view.setUint8(ctx.byteOffset + 2, value);
		}, 0x42);
		strictEqual(serializer.byteLength, 3);
		deepStrictEqual(serializer.serialize(), binary`000042`.buffer);

		serializer.append(3, (ctx, value) => {
			strictEqual(ctx.byteOffset, 3);
			strictEqual(value, "foo");
			ctx.array.set(new TextEncoder().encode(value), ctx.byteOffset);
		}, "foo");
		strictEqual(serializer.byteLength, 6);
		deepStrictEqual(serializer.serialize(), binary`000042${"foo"}`.buffer);
	});

	for (const [name, fn, expected] of [
		[`${Serializer.prototype.use.name} (function)`, (s: Serializer) => s.use(s => s.uint8(0x42)), binary`42`],
		[`${Serializer.prototype.use.name} (object)`, (s: Serializer) => s.use({
			serialize(s) {
				s.uint8(0x42);
			},
		}), binary`42`],

		[`${Serializer.prototype.use.name} (prefer function)`, (s: Serializer) => s.use(Object.assign((serializer: Serializer) => {
			serializer.uint8(0x42);
		}, {
			serialize(serializer: Serializer) {
				serializer.uint8(0x84);
			},
		})), binary`42`],

		[`${Serializer.prototype.boolean.name} (true)`, (s: Serializer) => s.boolean(true), binary`01`],
		[`${Serializer.prototype.boolean.name} (false)`, (s: Serializer) => s.boolean(false), binary`00`],

		[Serializer.prototype.none.name, (s: Serializer) => s.none(), binary`00`],
		[Serializer.prototype.some.name, (s: Serializer) => s.some(), binary`01`],

		[`${Serializer.prototype.useOption.name} (none, null)`, (s: Serializer) => s.useOption(null), binary`00`],
		[`${Serializer.prototype.useOption.name} (none, undefined)`, (s: Serializer) => s.useOption(undefined), binary`00`],
		[`${Serializer.prototype.useOption.name} (some)`, (s: Serializer) => s.useOption((s: Serializer) => s.uint8(0x42)), binary`0142`],

		[`${Serializer.prototype.option.name} (none, null)`, (s: Serializer) => s.option(null, uint8), binary`00`],
		[`${Serializer.prototype.option.name} (none, undefined)`, (s: Serializer) => s.option(undefined, uint8), binary`00`],
		[`${Serializer.prototype.option.name} (some)`, (s: Serializer) => s.option(0x42, uint8), binary`0142`],

		[Serializer.prototype.uint8.name, (s: Serializer) => s.uint8(0x42), binary`42`],

		[Serializer.prototype.uint16.name, (s: Serializer) => s.uint16(0x1234), binary`1234`],
		[Serializer.prototype.uint16le.name, (s: Serializer) => s.uint16le(0x1234), binary`1234`.reverse],

		[Serializer.prototype.uint32.name, (s: Serializer) => s.uint32(0x12345678), binary`12345678`],
		[Serializer.prototype.uint32le.name, (s: Serializer) => s.uint32le(0x12345678), binary`12345678`.reverse],

		[Serializer.prototype.uint64.name, (s: Serializer) => s.uint64(0x0123456789abcdefn), binary`0123456789abcdef`],
		[Serializer.prototype.uint64le.name, (s: Serializer) => s.uint64le(0x0123456789abcdefn), binary`0123456789abcdef`.reverse],

		[`${Serializer.prototype.float32.name} (0)`, (s: Serializer) => s.float32(0), binary`00000000`],
		[`${Serializer.prototype.float32.name} (-42.7)`, (s: Serializer) => s.float32(-42.7), binary`c22acccd`],
		[`${Serializer.prototype.float32.name} (NaN)`, (s: Serializer) => s.float32(NaN), binary`7fc00000`],
		[`${Serializer.prototype.float32.name} (Infinity)`, (s: Serializer) => s.float32(Infinity), binary`7f800000`],
		[`${Serializer.prototype.float32.name} (-Infinity)`, (s: Serializer) => s.float32(-Infinity), binary`ff800000`],

		[`${Serializer.prototype.float32le.name} (0)`, (s: Serializer) => s.float32le(0), binary`00000000`.reverse],
		[`${Serializer.prototype.float32le.name} (-42.7)`, (s: Serializer) => s.float32le(-42.7), binary`c22acccd`.reverse],
		[`${Serializer.prototype.float32le.name} (NaN)`, (s: Serializer) => s.float32le(NaN), binary`7fc00000`.reverse],
		[`${Serializer.prototype.float32le.name} (Infinity)`, (s: Serializer) => s.float32le(Infinity), binary`7f800000`.reverse],
		[`${Serializer.prototype.float32le.name} (-Infinity)`, (s: Serializer) => s.float32le(-Infinity), binary`ff800000`.reverse],

		[`${Serializer.prototype.float64.name} (0)`, (s: Serializer) => s.float64(0), binary`0000000000000000`],
		[`${Serializer.prototype.float64.name} (-42.7)`, (s: Serializer) => s.float64(-42.7), binary`c04559999999999a`],
		[`${Serializer.prototype.float64.name} (NaN)`, (s: Serializer) => s.float64(NaN), binary`7ff80000000000000`],
		[`${Serializer.prototype.float64.name} (Infinity)`, (s: Serializer) => s.float64(Infinity), binary`7ff00000000000000`],
		[`${Serializer.prototype.float64.name} (-Infinity)`, (s: Serializer) => s.float64(-Infinity), binary`fff00000000000000`],

		[`${Serializer.prototype.float64le.name} (0)`, (s: Serializer) => s.float64le(0), binary`0000000000000000`.reverse],
		[`${Serializer.prototype.float64le.name} (-42.7)`, (s: Serializer) => s.float64le(-42.7), binary`c04559999999999a`.reverse],
		[`${Serializer.prototype.float64le.name} (NaN)`, (s: Serializer) => s.float64le(NaN), binary`7ff80000000000000`.reverse],
		[`${Serializer.prototype.float64le.name} (Infinity)`, (s: Serializer) => s.float64le(Infinity), binary`7ff00000000000000`.reverse],
		[`${Serializer.prototype.float64le.name} (-Infinity)`, (s: Serializer) => s.float64le(-Infinity), binary`fff00000000000000`.reverse],

		[Serializer.prototype.bytes.name, (s: Serializer) => s.bytes(binary`0123`.buffer), binary`0123`],
		[Serializer.prototype.utf8.name, (s: Serializer) => s.utf8("Hello World!"), binary`${"Hello World!"}`],
		[Serializer.prototype.prefixedBytes.name, (s: Serializer) => s.prefixedBytes(s.uint8, binary`0123`.buffer), binary`020123`],
		[Serializer.prototype.prefixedUTF8.name, (s: Serializer) => s.prefixedUTF8(s.uint8, "Hello World!"), binary`0c${"Hello World!"}`],
	] as const) {
		await test(`Serializer.${name}`, () => {
			const serializer = new Serializer();
			serializer.append(1, () => {});
			fn(serializer);
			serializer.append(1, () => {});
			deepStrictEqual(serializer.serialize(), binary`00${expected.buffer}00`.buffer);
		});
	}

	function uint8(s: Serializer, v: number) {
		s.uint8(v);
	}

	await test(`${Serializer.serialize.name} (function)`, t => {
		deepStrictEqual(Serializer.serialize(w => {
			w.uint8(0x42);
		}), binary`42`.buffer);
	});

	await test(`${Serializer.serialize.name} (object)`, t => {
		deepStrictEqual(Serializer.serialize({
			serialize(serializer) {
				serializer.uint8(0x42);
			},
		}), binary`42`.buffer);
	});

	await test(`${Serializer.serialize.name} (prefer function)`, t => {
		deepStrictEqual(Serializer.serialize(Object.assign((serializer: Serializer) => {
			serializer.uint8(0x42);
		}, {
			serialize(serializer: Serializer) {
				serializer.uint8(0x84);
			},
		})), binary`42`.buffer);
	});

	await test(`${Serializer.serialize.name} (instance, existing buffer)`, t => {
		const s = new Serializer();
		s.uint8(0x42);
		const buffer = new ArrayBuffer(3);
		s.serialize(buffer);
		deepStrictEqual(buffer, binary`42 00 00`.buffer);
		s.serialize(buffer, 1);
		deepStrictEqual(buffer, binary`42 42 00`.buffer);
	});

	await test(`${Serializer.serialize.name} (static, existing buffer)`, t => {
		const obj = (s: Serializer) => {
			s.uint8(0x42);
		};

		const buffer = new ArrayBuffer(3);
		Serializer.serialize(obj, buffer);
		deepStrictEqual(buffer, binary`42 00 00`.buffer);
		Serializer.serialize(obj, buffer, 1);
		deepStrictEqual(buffer, binary`42 42 00`.buffer);
	});
});

