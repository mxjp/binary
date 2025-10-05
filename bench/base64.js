import { randomBytes } from "node:crypto";
import { Bench } from "tinybench";
import { base64Decode, base64Encode } from "@mxjp/binary";

const bench = new Bench();

const data = new Uint8Array(randomBytes(10_000));
const dataBase64 = Buffer.from(data).toString("base64");

bench.add("encode 10k bytes", () => {
	base64Encode(data);
});

bench.add("decode 10k bytes", () => {
	base64Decode(dataBase64);
});

bench.runSync();
console.table(bench.table());
