
export enum Endianess {
	Little = 0,
	Big = 1,
}

let _platformEndianess: Endianess | undefined = undefined;

/**
 * Get the endianess of the current platform.
 */
export function platformEndianess(): Endianess {
	if (_platformEndianess === undefined) {
		const buffer = new ArrayBuffer(2);
		new Uint16Array(buffer)[0] = 1;
		_platformEndianess = new Uint8Array(buffer)[1];
	}
	return _platformEndianess;
}
