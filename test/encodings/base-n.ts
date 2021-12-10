import test from "ava";
import { BASE58, BASE62, decodeBaseN, encodeBaseN } from "../../src/encoding/base-n";
import { getPseudoRandomBytes } from "../_common/random-bytes";

test(`${encodeBaseN.name} buffers`, t => {
	t.is(encodeBaseN(Buffer.from("Hello World!"), BASE62), "0T8dgcjRGkZ3aysdN");
	t.is(encodeBaseN(Buffer.from("Hello World!"), BASE62, false), "T8dgcjRGkZ3aysdN");
	t.is(encodeBaseN(Buffer.from("Hello World!"), BASE58), "2NEpo7TZRRrLZSi2U");
});

test(`${encodeBaseN.name} numbers`, t => {
	for (const [value, text] of [
		[42, "g"],
		[62, "10"],
		[125, "21"],
	] as [number, string][]) {
		t.is(encodeBaseN(value, BASE62), text);
		t.is(encodeBaseN(BigInt(value), BASE62), text);
	}
});

test(`${encodeBaseN.name} invalid data`, t => {
	for (const value of [
		"/",
		":",
		"@",
		"[",
		"`",
		"{"
	]) {
		t.throws(() => decodeBaseN(value, BASE62));
	}
});

for (const alphabet of [
	BASE62,
	BASE58,
]) {
	const name = `base${alphabet.base}`;

	test(`${name} ${encodeBaseN.name}/${decodeBaseN.name}`, t => {
		for (const data of [
			new Uint8Array(),
			new Uint8Array(500),
			new Uint8Array(Buffer.alloc(256, 0xff)),

			getPseudoRandomBytes(1),
			getPseudoRandomBytes(2),
			getPseudoRandomBytes(3),
			getPseudoRandomBytes(10),
			getPseudoRandomBytes(Math.ceil(256 * Math.log2(alphabet.chars.length))),
		]) {
			t.deepEqual(decodeBaseN(encodeBaseN(data, alphabet), alphabet), data);
		}
	});

	test(`${name} byte length retention`, t => {
		for (let i = 0; i < 500; i++) {
			t.is(i, decodeBaseN(encodeBaseN(new Uint8Array(i), alphabet), alphabet).byteLength);
			t.is(i, decodeBaseN(encodeBaseN(Buffer.alloc(i, 0xff), alphabet), alphabet).byteLength);
		}
	});
}
