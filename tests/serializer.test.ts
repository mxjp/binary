import { Serializer } from "@mxjp/binary";
import { deepStrictEqual, fail, strictEqual, throws } from "node:assert";
import test, { suite } from "node:test";

await suite("serialize", async () => {
	function serializeTest(fn: (s: Serializer) => void, bytes: number[]) {
		const s = new Serializer();
		fn(s);
		deepStrictEqual(new Uint8Array(s.serialize()), new Uint8Array(bytes));
	}

	await test("empty", () => serializeTest(() => {}, []));

	await test("u8 & error recovery", () => serializeTest(s => {
		throws(() => s.u8(-1));
		throws(() => s.u8(0x10000));
		throws(() => s.u8(5.5));

		s.u8(0);
		s.u8(0xff);
		s.u8(42);
	}, [0, 0xff, 42]));

	await test("u16", () => serializeTest(s => {
		throws(() => s.u16(-1));
		throws(() => s.u16(0x10000));
		throws(() => s.u16(5.5));

		s.u16(0);
		s.u16(0xffff);
		s.u16(0x7742);
	}, [0, 0, 0xff, 0xff, 0x42, 0x77]));

	await test("u32", () => serializeTest(s => {
		throws(() => s.u32(-1));
		throws(() => s.u32(0x1_0000_0000));
		throws(() => s.u32(5.5));

		s.u32(0);
		s.u32(0xffff_ffff);
		s.u32(0x7742_1234);
	}, [0, 0, 0, 0, 0xff, 0xff, 0xff, 0xff, 0x34, 0x12, 0x42, 0x77]));

	await test("u64", () => serializeTest(s => {
		throws(() => s.u64(-1));
		throws(() => s.u64(Number.MAX_SAFE_INTEGER + 1));
		throws(() => s.u64(5.5));
		throws(() => s.u64(7n as unknown as number));

		s.u64(0);
		s.u64(0x001f_ffff_ffff_ffff);
		s.u64(0x0017_4321_7742_1234);
	}, [0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x1f, 0x00, 0x34, 0x12, 0x42, 0x77, 0x21, 0x43, 0x17, 0x00]));

	await test("bigU64", () => serializeTest(s => {
		throws(() => s.bigU64(7 as unknown as bigint));
		throws(() => s.bigU64(-1n));
		throws(() => s.bigU64(0x1_0000_0000_0000_0000n));

		s.bigU64(0n);
		s.bigU64(0xffff_ffff_ffff_ffffn);
		s.bigU64(0x2817_4321_7742_1234n);
	}, [0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x34, 0x12, 0x42, 0x77, 0x21, 0x43, 0x17, 0x28]));

	await test("f32", () => serializeTest(s => {
		s.f32(-Infinity);
		s.f32(7.44);
	}, [0, 0, 0x80, 0xff, 0x7b, 0x14, 0xee, 0x40]));

	await test("f64", () => serializeTest(s => {
		s.f64(Infinity);
		s.f64(-1234.5678);
	}, [0, 0, 0, 0, 0, 0, 240, 127, 173, 250, 92, 109, 69, 74, 147, 192]));

	await test("bool", () => serializeTest(s => {
		throws(() => s.bool(1 as unknown as boolean));
		s.bool(false);
		s.bool(true);
	}, [0, 1]));

	await test("option", () => serializeTest(s => {
		s.option(null, fail);
		s.u8(77);
		s.option(undefined, fail);
		s.u8(42);
		s.option(false, (value, s2) => {
			const _type: boolean = value;

			strictEqual(s, s2);
			strictEqual(value, false);
			s2.u8(123);
		});
	}, [0, 77, 0, 42, 1, 123]));

	await test("unsafeBytes", () => {
		const arr = new Uint8Array([1, 2, 3]);
		const s = new Serializer();
		s.unsafeBytes(arr);
		deepStrictEqual(new Uint8Array(s.serialize()), new Uint8Array([1, 2, 3]));
		arr[1] = 0x77;
		deepStrictEqual(new Uint8Array(s.serialize()), new Uint8Array([1, 0x77, 3]));

		s.unsafeBytes(arr.buffer.slice(arr.byteOffset, arr.byteLength));
		deepStrictEqual(new Uint8Array(s.serialize()), new Uint8Array([1, 0x77, 3, 1, 0x77, 3]));
	});

	await test("prefixedUnsafeBytes", () => serializeTest(s => {
		s.prefixedUnsafeBytes(s.u16, new Uint8Array([0x42, 0x77, 0x55]));
		const buf = new ArrayBuffer(3);
		new Uint8Array(buf).set([0x42, 0x77, 0x55]);
		s.prefixedUnsafeBytes(s.u16, buf);
	}, [3, 0, 0x42, 0x77, 0x55, 3, 0, 0x42, 0x77, 0x55]));

	await test("custom prefix", () => serializeTest(s => {
		const buf = new ArrayBuffer(2);
		new Uint8Array(buf).set([1, 2]);
		s.prefixedUnsafeBytes(function (this: Serializer, byteLength: number) {
			strictEqual(byteLength, 2);
			this.u16(0x7777);
		}, buf);
	}, [0x77, 0x77, 1, 2]));

	await test("utf8", () => serializeTest(s => {
		s.utf8("frit");
	}, [102, 114, 105, 116]));

	await test("prefixedUtf8", () => serializeTest(s => {
		s.prefixedUtf8(s.u16, "frit");
	}, [4, 0, 102, 114, 105, 116]));

	await test("big endian", () => {
		const s = new Serializer(false);

		s.u16(0x1234);
		s.u32(0x56000078);
		s.f32(7.44);
		s.f64(-1234.5678);

		deepStrictEqual(new Uint8Array(s.serialize()), new Uint8Array([0x12, 0x34, 0x56, 0, 0, 0x78, 0x40, 0xee, 0x14, 0x7b, 192, 147, 74, 69, 109, 92, 250, 173]));
	});
});
