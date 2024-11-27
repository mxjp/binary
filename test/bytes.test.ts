import { asUint8Array, bytesEqual, concatBytes, lexicalCompareBytes } from "@mpt/binary";
import { deepStrictEqual, strictEqual } from "node:assert";
import test, { suite } from "node:test";
import { binary } from "./common/binary.js";

await suite("bytes", async () => {
	await test(asUint8Array.name, t => {
		const test = binary`0123`;
		deepStrictEqual(asUint8Array(test.buffer), test.array);
		deepStrictEqual(asUint8Array(test.array), test.array);
	});

	await test(bytesEqual.name, t => {
		strictEqual(bytesEqual(binary``.array, binary``.array), true);
		strictEqual(bytesEqual(binary`0123`.array, binary`0123`.array), true);
		strictEqual(bytesEqual(binary`0123`.array, binary`0145`.array), false);
		strictEqual(bytesEqual(binary`0123`.array, binary`01`.array), false);
		strictEqual(bytesEqual(binary`0123`.array, binary`012345`.array), false);
	});

	await test(lexicalCompareBytes.name, t => {
		strictEqual(lexicalCompareBytes(binary``.array, binary``.array), 0);
		strictEqual(lexicalCompareBytes(binary`00`.array, binary``.array), 1);
		strictEqual(lexicalCompareBytes(binary``.array, binary`00`.array), -1);
		strictEqual(lexicalCompareBytes(binary`012445`.array, binary`012345`.array), 1);
		strictEqual(lexicalCompareBytes(binary`012345`.array, binary`012345`.array), 0);
		strictEqual(lexicalCompareBytes(binary`012245`.array, binary`012345`.array), -1);
	});

	await test(concatBytes.name, t => {
		deepStrictEqual(concatBytes([]), binary``.array);
		deepStrictEqual(concatBytes([
			binary`0102`.array,
			binary`0304`.buffer,
			binary``.array,
			binary`05`.buffer,
		]), binary`0102030405`.array);
	});
});
