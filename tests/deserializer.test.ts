import { Deserializer, DeserializerEndError } from "@mxjp/binary";
import { deepStrictEqual, strictEqual, throws } from "node:assert";
import test, { suite } from "node:test";

await suite("deserializer", async () => {
	await test("basic usage", () => {
		const data = new Uint8Array([
			0x42,
			0x34, 0x12,
			0x56, 0x00, 0x00, 0x78,
			0x21, 0x00, 0x00, 0x55, 0x77, 0xff, 0x01, 0x00,
			0x21, 0x00, 0x00, 0x55, 0x77, 0xff, 0xf1, 0xff,
			0x7b, 0x14, 0xee, 0x40,
			173, 250, 92, 109, 69, 74, 147, 192,
			0,
			1,
			0x44, 0x77,
			0x55, 0x66,
		]);

		const d = Deserializer.from(data);
		strictEqual(d.bytesAvailable, data.byteLength);
		strictEqual(d.u8(), 0x42);
		strictEqual(d.u16(), 0x1234);
		strictEqual(d.u32(), 0x7800_0056);
		strictEqual(d.u64(), 0x0001_ff77_5500_0021);
		strictEqual(d.bigU64(), 0xfff1_ff77_5500_0021n);
		strictEqual(d.f32(), 7.440000057220459);
		const d2 = d.fork();
		strictEqual(d.f64(), -1234.5678);
		strictEqual(d.bool(), false);
		strictEqual(d.bool(), true);
		throws(() => d.fork().bool(), e => e instanceof RangeError);
		deepStrictEqual(d.unsafeViewBytes(2, Uint8Array), new Uint8Array([0x44, 0x77]));
		deepStrictEqual(d.copyBytes(2), new Uint8Array([0x55, 0x66]).buffer);
		strictEqual(d.bytesAvailable, 0);

		strictEqual(d2.f64(), -1234.5678);
		strictEqual(d2.bool(), false);
	});

	await test("big endian", () => {
		const data = new Uint8Array([
			0x12, 0x34,
			0x78, 0x00, 0x00, 0x56,
			0x00, 0x01, 0xff, 0x77, 0x55, 0x00, 0x00, 0x21,
			0xff, 0xf1, 0xff, 0x77, 0x55, 0x00, 0x00, 0x21,
			0x40, 0xee, 0x14, 0x7b,
			192, 147, 74, 69, 109, 92, 250, 173,
		]);

		const d = Deserializer.from(data, false);
		strictEqual(d.bytesAvailable, data.byteLength);
		strictEqual(d.u16(), 0x1234);
		const d2 = d.fork();
		strictEqual(d.u32(), 0x7800_0056);
		strictEqual(d.u64(), 0x0001_ff77_5500_0021);
		strictEqual(d.bigU64(), 0xfff1_ff77_5500_0021n);
		strictEqual(d.f32(), 7.440000057220459);
		strictEqual(d.f64(), -1234.5678);
		strictEqual(d.bytesAvailable, 0);

		const d3 = d2.fork(true);
		strictEqual(d2.u32(), 0x7800_0056);
		strictEqual(d3.u32(), 0x5600_0078);
	});

	await test("unsafe view types", () => {
		const buffer = new ArrayBuffer(10);
		const d = Deserializer.from(new Uint8Array(buffer, 2, 6));

		const arr = d.unsafeViewBytes(3, Uint8Array);
		strictEqual(arr.buffer, buffer);
		strictEqual(arr.byteOffset, 2);
		strictEqual(arr.byteLength, 3);

		const view = d.unsafeViewBytes(3, DataView);
		strictEqual(view.buffer, buffer);
		strictEqual(view.byteOffset, 5);
		strictEqual(view.byteLength, 3);
	});

	await test("source offsets", () => {
		const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
		const d = new Deserializer(buffer, 1, 2);
		strictEqual(d.u8(), 2);
		strictEqual(d.u8(), 3);
		strictEqual(d.bytesAvailable, 0);
	});

	await test("overflows", () => {
		function testEndError(byteLength: number, fn: (d: Deserializer) => void) {
			const exact = Deserializer.from(new ArrayBuffer(byteLength));
			throws(() => fn(exact), e => e instanceof DeserializerEndError);

			const leading = new Deserializer(new ArrayBuffer(byteLength + 10), 0, byteLength);
			throws(() => fn(leading), e => e instanceof DeserializerEndError);

			const trailing = new Deserializer(new ArrayBuffer(byteLength + 10), 10, byteLength);
			throws(() => fn(trailing), e => e instanceof DeserializerEndError);
		}

		testEndError(0, d => d.u8());
		testEndError(1, d => d.u16());
		testEndError(3, d => d.u32());
		testEndError(7, d => d.u64());
		testEndError(7, d => d.bigU64());
		testEndError(4, d => d.unsafeViewBytes(5, Uint8Array));
		testEndError(4, d => d.copyBytes(5));
	});

	await test("u64 overflow", () => {
		const d = Deserializer.from(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00]));
		throws(() => d.fork().u64(), e => e instanceof RangeError);
		strictEqual(d.fork().bigU64(), 0x0020_0000_0000_0000n);
	});
});
