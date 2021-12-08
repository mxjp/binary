import test from "ava";
import { decodeHex, encodeHex } from "../../src";

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

test(`${decodeHex.name}`, t => {
	t.deepEqual(decodeHex(hex), bytes);
});

test(`${decodeHex.name} (upper case)`, t => {
	t.deepEqual(decodeHex(hex.toUpperCase()), bytes);
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
