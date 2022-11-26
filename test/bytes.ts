import test from "ava";

import { asUint8Array, bytesEqual, concatBytes, lexicalCompareBytes } from "../src/index.js";
import { binary } from "./_common/binary.js";

test(asUint8Array.name, t => {
	const test = binary`0123`;
	t.deepEqual(asUint8Array(test.buffer), test.array);
	t.deepEqual(asUint8Array(test.array), test.array);
});

test(bytesEqual.name, t => {
	t.true(bytesEqual(binary``.array, binary``.array));
	t.true(bytesEqual(binary`0123`.array, binary`0123`.array));
	t.false(bytesEqual(binary`0123`.array, binary`0145`.array));
	t.false(bytesEqual(binary`0123`.array, binary`01`.array));
	t.false(bytesEqual(binary`0123`.array, binary`012345`.array));
});

test(lexicalCompareBytes.name, t => {
	t.is(lexicalCompareBytes(binary``.array, binary``.array), 0);
	t.is(lexicalCompareBytes(binary`00`.array, binary``.array), 1);
	t.is(lexicalCompareBytes(binary``.array, binary`00`.array), -1);
	t.is(lexicalCompareBytes(binary`012445`.array, binary`012345`.array), 1);
	t.is(lexicalCompareBytes(binary`012345`.array, binary`012345`.array), 0);
	t.is(lexicalCompareBytes(binary`012245`.array, binary`012345`.array), -1);
});

test(concatBytes.name, t => {
	t.deepEqual(concatBytes([]), binary``.array);
	t.deepEqual(concatBytes([
		binary`0102`.array,
		binary`0304`.buffer,
		binary``.array,
		binary`05`.buffer,
	]), binary`0102030405`.array);
});
