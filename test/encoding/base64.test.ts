import { decodeBase64, decodeBase64URL, encodeBase64, encodeBase64URL } from "@mpt/binary";
import { deepStrictEqual, strictEqual, throws } from "node:assert";
import test, { suite } from "node:test";
import { binary } from "../common/binary.js";
import { getPseudoRandomBytes } from "../common/random-bytes.js";

await suite("encoding/base64", async () => {
	await test(`${encodeBase64.name}, ${encodeBase64URL.name}`, t => {
		for (const data of [
			binary``.array,
			binary`12`.array,
			binary`1234`.array,
			binary`123456`.array,
			binary`12345678`.array,
			binary`123456789a`.array,
			binary`123456789abc`.array,
			getPseudoRandomBytes(10000),
		]) {
			strictEqual(encodeBase64(data), Buffer.from(data).toString("base64"));
			strictEqual(encodeBase64URL(data), Buffer.from(data).toString("base64url"));
			strictEqual(encodeBase64URL(data, true), Buffer.from(data).toString("base64")
				.replace(/\+/g, "-")
				.replace(/\//g, "_"));
		}
	});

	await test(`${decodeBase64.name}, ${decodeBase64URL.name}`, t => {
		for (const data of [
			binary``.array,
			binary`12`.array,
			binary`1234`.array,
			binary`123456`.array,
			binary`12345678`.array,
			binary`123456789a`.array,
			binary`123456789abc`.array,
			getPseudoRandomBytes(10000),
		]) {
			deepStrictEqual(decodeBase64(Buffer.from(data).toString("base64")), data);
			deepStrictEqual(decodeBase64(Buffer.from(data).toString("base64") + "="), data);
			deepStrictEqual(decodeBase64(Buffer.from(data).toString("base64") + "=="), data);
			deepStrictEqual(decodeBase64(Buffer.from(data).toString("base64") + "==="), data);
			deepStrictEqual(decodeBase64(Buffer.from(data).toString("base64") + "===="), data);
			deepStrictEqual(decodeBase64URL(Buffer.from(data).toString("base64url")), data);
			deepStrictEqual(decodeBase64(Buffer.from(data).toString("base64").replace(/[=]/g, "")), data);
		}

		for (const invalid of [
			"1",
			"!AAA",
			"A!AA",
			"AA!A",
			"AAA!",
			"{AAA",
			"A{AA",
			"AA{A",
			"AAA{",
		]) {
			throws(() => decodeBase64(invalid));
			throws(() => decodeBase64("AAAA" + invalid));
		}
	});
});
