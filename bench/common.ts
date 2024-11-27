import { createHash } from "node:crypto";

export function getPseudoRandomBytes(length: number, seed = ""): Uint8Array {
	const array = new Uint8Array(length);
	for (let i = 0; i < length; i += 20) {
		const hash = createHash("sha1")
			.update(i === 0 ? Buffer.from(seed, "utf-8") : array.slice(i - 20, i))
			.digest();

		array.set(hash.slice(0, Math.min(20, length - i)), i);
	}
	return array;
}
