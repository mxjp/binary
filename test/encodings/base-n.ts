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

test(`${encodeBaseN.name} byte limit`, t => {
	t.notThrows(() => encodeBaseN(new Uint8Array(64), BASE62, undefined, 64));
	t.throws(() => encodeBaseN(new Uint8Array(65), BASE62, undefined, 64));

	t.notThrows(() => encodeBaseN(0xFFFFFFFFFFFFFFFFn, BASE62, undefined, 8));
	t.throws(() => encodeBaseN(0x10000000000FFFFFFn, BASE62, undefined, 8));
});

test(`${decodeBaseN.name} byte limit`, t => {
	const ok = encodeBaseN(new Uint8Array(64), BASE62, undefined, 64);
	const notOk = encodeBaseN(new Uint8Array(65), BASE62, undefined, 65);

	t.notThrows(() => decodeBaseN(ok, BASE62, 64));
	t.throws(() => decodeBaseN(notOk, BASE62, 64));
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
			getPseudoRandomBytes(1000),
		]) {
			t.deepEqual(decodeBaseN(encodeBaseN(data, alphabet, undefined, 1000), alphabet, 1000), data);
		}
	});

	test(`${name} byte length retention`, t => {
		for (let i = 0; i < 500; i++) {
			t.is(i, decodeBaseN(encodeBaseN(new Uint8Array(i), alphabet, undefined, 500), alphabet, 500).byteLength);
			t.is(i, decodeBaseN(encodeBaseN(Buffer.alloc(i, 0xff), alphabet, undefined, 500), alphabet, 500).byteLength);
		}
	});
}
