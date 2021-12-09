import test from "ava";
import { decodeHex, encodeHex } from "../../src";
import { getPseudoRandomBytes } from "../_common/random-bytes";

const bytes = new Uint8Array(256);
let hex = "";

for (let i = 0; i < 256; i++) {
	bytes[i] = i;
	hex += i.toString(16).padStart(2, "0");
}

test(`${encodeHex.name}`, t => {
	t.is(encodeHex(bytes), hex);
});

test(`${encodeHex.name} (upper case)`, t => {
	t.is(encodeHex(bytes, true), hex.toUpperCase());
});

test(`${encodeHex.name} (random data)`, t => {
	const data = getPseudoRandomBytes(10000);
	const hex = Buffer.from(data).toString("hex");
	t.is(encodeHex(data, false), hex);
});

test(`${decodeHex.name}`, t => {
	t.deepEqual(decodeHex(hex), bytes);
});

test(`${decodeHex.name} (upper case)`, t => {
	t.deepEqual(decodeHex(hex.toUpperCase()), bytes);
});

test(`${decodeHex.name} (random data)`, t => {
	const data = getPseudoRandomBytes(10000);
	const hex = Buffer.from(data).toString("hex");
	t.deepEqual(decodeHex(hex), data);
});

for (const hex of [
	"0",
	"000",
	"0g",
	"g0",
	"0G",
	"G0",
]) {
	test.only(`${decodeHex.name} (invalid: ${hex})`, t => {
		t.throws(() => decodeHex(hex));
	});
}
