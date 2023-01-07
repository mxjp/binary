import test, { ExecutionContext } from "ava";

import { encodeBase32 } from "../../src/index.js";
import { Binary, binary } from "../_common/binary.js";

const encode = test.macro({
	exec(t: ExecutionContext, data: Binary, output: string) {
		t.is(encodeBase32(data.array), output);
		t.is(encodeBase32(data.buffer), output);

		const paddedOutput = output.padEnd(Math.ceil(output.length / 8) * 8, "=");
		t.is(encodeBase32(data.array, true), paddedOutput);
		t.is(encodeBase32(data.buffer, true), paddedOutput);
	},
	title(_, data: Binary) {
		return `${encodeBase32.name}(${data.hex})`;
	},
});

test(encode, binary``, "");
test(encode, binary`12`, "CI");
test(encode, binary`1234`, "CI2A");
test(encode, binary`123456`, "CI2FM");
test(encode, binary`12345678`, "CI2FM6A");
test(encode, binary`123456789a`, "CI2FM6E2");
test(encode, binary`123456789abc`, "CI2FM6E2XQ");
test(encode, binary`2ad81a04447d744685e74a024abdec5617245cd8ec0822ab05e2bcce16fcd9c67d840f9827ece852dd347ff6f80fb89a10ae1d06a84f5213524aa6121f005c6f`, "FLMBUBCEPV2ENBPHJIBEVPPMKYLSIXGY5QECFKYF4K6M4FX43HDH3BAPTAT6Z2CS3U2H75XYB64JUEFODUDKQT2SCNJEVJQSD4AFY3Y");
