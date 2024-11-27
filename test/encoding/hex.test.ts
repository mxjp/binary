import { decodeHex, encodeHex } from "@mpt/binary";
import { deepStrictEqual, strictEqual, throws } from "node:assert";
import test, { suite } from "node:test";
import { getPseudoRandomBytes } from "../common/random-bytes.js";

await suite("encoding/hex", async () => {
	const bytes = new Uint8Array(256);
	let hex = "";

	for (let i = 0; i < 256; i++) {
		bytes[i] = i;
		hex += i.toString(16).padStart(2, "0");
	}

	await test(`${encodeHex.name}`, t => {
		strictEqual(encodeHex(bytes), hex);
	});

	await test(`${encodeHex.name} (upper case)`, t => {
		strictEqual(encodeHex(bytes, true), hex.toUpperCase());
	});

	await test(`${encodeHex.name} (random data)`, t => {
		const data = getPseudoRandomBytes(10000);
		const hex = Buffer.from(data).toString("hex");
		strictEqual(encodeHex(data, false), hex);
	});

	await test(`${decodeHex.name}`, t => {
		deepStrictEqual(decodeHex(hex), bytes);
	});

	await test(`${decodeHex.name} (upper case)`, t => {
		deepStrictEqual(decodeHex(hex.toUpperCase()), bytes);
	});

	await test(`${decodeHex.name} (random data)`, t => {
		const data = getPseudoRandomBytes(10000);
		const hex = Buffer.from(data).toString("hex");
		deepStrictEqual(decodeHex(hex), data);
	});

	for (const hex of [
		"0",
		"000",
		"0g",
		"g0",
		"0G",
		"G0",
	]) {
		await test(`${decodeHex.name} (invalid: ${hex})`, t => {
			throws(() => decodeHex(hex));
		});
	}
});

