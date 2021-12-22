import test from "ava";
import { BASE62, BASE58, decodeBaseX, encodeBaseX } from "../../src";
import { binary } from "../_common/binary";
import { getPseudoRandomBytes } from "../_common/random-bytes";
import baseX from "base-x";

test(`${encodeBaseX.name}`, t => {
	t.is(encodeBaseX(binary`${"Hello World!"}`.array, BASE62), "0T8dgcjRGkZ3aysdN");
	t.is(encodeBaseX(binary`${"Hello World!"}`.array, BASE58), "2NEpo7TZRRrLZSi2U");
});

test(`${decodeBaseX.name}`, t => {
	t.deepEqual(decodeBaseX("0T8dgcjRGkZ3aysdN", BASE62), binary`${"Hello World!"}`.array);
	t.deepEqual(decodeBaseX("2NEpo7TZRRrLZSi2U", BASE58), binary`${"Hello World!"}`.array);
});

for (const alphabet of [
	BASE62,
	BASE58,
]) {
	test(`${encodeBaseX.name}/${decodeBaseX.name} (base${alphabet.base}, random bytes)`, t => {
		const data = getPseudoRandomBytes(256);
		for (let i = 0; i < data.byteLength; i++) {
			const slice = data.slice(0, i);
			const encoded = encodeBaseX(slice, alphabet);
			const decoded = decodeBaseX(encoded, alphabet);
			t.deepEqual(slice, decoded);
		}
		t.pass();
	});

	test(`${encodeBaseX.name}/${decodeBaseX.name} (base${alphabet.base}, unset bytes)`, t => {
		const data = Buffer.alloc(256, 0);
		for (let i = 0; i < data.byteLength; i++) {
			const slice = new Uint8Array(data.slice(0, i));
			const encoded = encodeBaseX(slice, alphabet);
			const decoded = decodeBaseX(encoded, alphabet);
			t.deepEqual(slice, decoded);
		}
	});

	test(`${encodeBaseX.name}/${decodeBaseX.name} (base${alphabet.base}, set bytes)`, t => {
		const data = Buffer.alloc(256, 0xff);
		for (let i = 0; i < data.byteLength; i++) {
			const slice = new Uint8Array(data.slice(0, i));
			const encoded = encodeBaseX(slice, alphabet);
			const decoded = decodeBaseX(encoded, alphabet);
			t.deepEqual(slice, decoded);
		}
	});
}

test("npm:base-x reference", t => {
	const instance = baseX(BASE62.chars);
	t.is(instance.encode(Buffer.from("Hello World!")), "T8dgcjRGkZ3aysdN");
	t.is(instance.decode("T8dgcjRGkZ3aysdN").toString("utf-8"), "Hello World!");
});
