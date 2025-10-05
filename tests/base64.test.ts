import { base64Decode, base64Encode, base64UrlDecode, base64UrlEncode, DecodeBase64Error } from "@mxjp/binary";
import { deepStrictEqual, strictEqual, throws } from "node:assert";
import test, { suite } from "node:test";

await suite("base64", async () => {
	await test("encode/decode", () => {
		for (const hex of [
			"",
			"00",
			"12",
			"ff",
			"0000",
			"1234",
			"ffff",
			"000000",
			"123456",
			"ffffff",
			"00000000",
			"12345678",
			"ffffffff",
			"0000000000",
			"123456789a",
			"ffffffffff",
			"000000000000",
			"123456789abc",
			"ffffffffffff",
			"00000000000000",
			"123456789abcde",
			"ffffffffffffff",
			"0000000000000000",
			"123456789abcdef0",
			"ffffffffffffffff",
			"69fb85bd9599d1bfffdd4f13766d115ffecfbf426b8e89ba7abcf356db18eccea1d27240e3bc17d6bd6ad2f82e53b364dd20d72993dc7cc897e02a3b770e1bbb2d8bd32fcd55929237ddeb6f338be7b6e21b49c770a3390d0a1142e4f91f62dfbb3a68ca",
		]) {
			const data = Buffer.from(hex, "hex");
			const bytes = new Uint8Array(data);
			const base64 = data.toString("base64");
			const base64Unpadded = base64.replace(/\=*$/, "");
			const base64Url = data.toString("base64url");
			const base64UrlPadded = base64Url.padEnd(Math.ceil(base64Url.length / 4) * 4, "=");

			strictEqual(base64Encode(bytes), base64);
			strictEqual(base64Encode(bytes, false), base64Unpadded);
			strictEqual(base64UrlEncode(bytes), base64Url);
			strictEqual(base64UrlEncode(bytes, true), base64UrlPadded);

			deepStrictEqual(base64Decode(base64), bytes);
			deepStrictEqual(base64Decode(base64Unpadded), bytes);
			deepStrictEqual(base64UrlDecode(base64Url), bytes);
			deepStrictEqual(base64UrlDecode(base64UrlPadded), bytes);
		}
	});

	await test("decode types", () => {
		throws(() => base64Decode({ toString: () => "AAAA" } as unknown as string), e => e instanceof TypeError);
	});

	await test("decode errors", () => {
		for (const value of [
			"1",
			"!AAA",
			"A!AA",
			"AA!A",
			"AAA!",
			"{AAA",
			"A{AA",
			"AA{A",
			"AAA{",
			"A",
			"A=",
			"A==",
			"A===",
			"AA=",
			"=",
			"==",
			"===",
			"====",
			"/x==",
			"//==",
			"/x",
			"//",
			"//9=",
			"///=",
			"//9",
			"///",
			"A===AAAA",
			"AA==AAAA",
			"AAA=AAAA",
		]) {
			throws(() => base64Decode(value), e => e instanceof DecodeBase64Error);
			throws(() => base64Decode("AAAA" + value), e => e instanceof DecodeBase64Error);
			throws(() => base64Decode("////" + value), e => e instanceof DecodeBase64Error);
		}
	});
});
