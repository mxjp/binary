
export type Bytes = ArrayBuffer | Uint8Array<ArrayBuffer>;

export function asUint8Array(value: Bytes): Uint8Array<ArrayBuffer> {
	if (value.constructor === ArrayBuffer) {
		return new Uint8Array(value);
	} else if (value.constructor === Uint8Array) {
		return value;
	} else {
		throw new TypeError();
	}
}
