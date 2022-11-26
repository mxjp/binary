
export const LITTLE_ENDIAN = 0;
export const BIG_ENDIAN = 1;

export type Endianess = typeof LITTLE_ENDIAN | typeof BIG_ENDIAN;

let _platformEndianess: Endianess | undefined = undefined;

/**
 * Get the endianess of the current platform.
 */
export function platformEndianess(): Endianess {
	if (_platformEndianess === undefined) {
		const buffer = new ArrayBuffer(2);
		new Uint16Array(buffer)[0] = 1;
		_platformEndianess = new Uint8Array(buffer)[1] as Endianess;
	}
	return _platformEndianess;
}
