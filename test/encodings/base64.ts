import test from "ava";
import { decodeBase64, decodeBase64URL, encodeBase64, encodeBase64URL } from "../../src/encoding/base64";
import { binary } from "../_common/binary";
import { getPseudoRandomBytes } from "../_common/random-bytes";

test(`${encodeBase64.name}, ${encodeBase64URL.name}`, t => {
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
		t.is(encodeBase64(data), Buffer.from(data).toString("base64"));
		t.is(encodeBase64URL(data), Buffer.from(data).toString("base64url"));
		t.is(encodeBase64URL(data, true), Buffer.from(data).toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_"));
	}
});

test(`${decodeBase64.name}, ${decodeBase64URL.name}`, t => {
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
		t.deepEqual(decodeBase64(Buffer.from(data).toString("base64")), data);
		t.deepEqual(decodeBase64(Buffer.from(data).toString("base64") + "="), data);
		t.deepEqual(decodeBase64(Buffer.from(data).toString("base64") + "=="), data);
		t.deepEqual(decodeBase64(Buffer.from(data).toString("base64") + "==="), data);
		t.deepEqual(decodeBase64(Buffer.from(data).toString("base64") + "===="), data);
		t.deepEqual(decodeBase64URL(Buffer.from(data).toString("base64url")), data);
		t.deepEqual(decodeBase64(Buffer.from(data).toString("base64").replace(/\=/g, "")), data);
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
		t.throws(() => decodeBase64(invalid));
		t.throws(() => decodeBase64("AAAA" + invalid));
	}
});
