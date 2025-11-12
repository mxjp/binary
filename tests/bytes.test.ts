import assert from "node:assert";
import { test } from "node:test";
import { bytesEqual } from "@mxjp/binary";

await test("bytesEqual", () => {
	assert(bytesEqual(new Uint8Array([]), new ArrayBuffer(0)));
	assert(bytesEqual(new Uint8Array([0, 1, 2]), new Uint8Array([0, 1, 2])));
	assert(!bytesEqual(new Uint8Array([0, 1, 2]), new Uint8Array([0, 3, 2])));
	assert(!bytesEqual(new Uint8Array([0, 1, 2]), new Uint8Array([0, 1, 2, 3])));
	assert(!bytesEqual(new Uint8Array([0, 1, 2, 3]), new Uint8Array([0, 1, 2])));
	assert(!bytesEqual(new Uint8Array([0, 1, 2]), new ArrayBuffer()));
});
