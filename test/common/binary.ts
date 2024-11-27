
export class Binary {
	public constructor(public readonly hex: string) {}

	public get nodeBuffer(): Buffer {
		return Buffer.from(this.hex, "hex");
	}

	public get buffer(): ArrayBuffer {
		const buffer = this.nodeBuffer;
		return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
	}

	public get array(): Uint8Array {
		return new Uint8Array(this.nodeBuffer);
	}

	public get view(): DataView {
		return new DataView(this.buffer);
	}

	public get reverse(): Binary {
		return new Binary(Buffer.from(Array.from(this.nodeBuffer).reverse()).toString("hex"));
	}
}

export function binary(parts: TemplateStringsArray, ...values: (ArrayBufferLike | string)[]): Binary {
	let str = "";
	for (let i = 0; i < parts.length; i++) {
		str += parts[i];
		if (i < values.length) {
			const value = values[i];
			if (typeof value === "string") {
				str += Buffer.from(value, "utf-8").toString("hex");
			} else {
				str += Buffer.from(new Uint8Array(value)).toString("hex");
			}
		}
	}
	str = str.replace(/#[^\n]*\n/g, "");
	str = str.replace(/\s+/g, "");
	if (/[^0-9a-f]/i.test(str)) {
		throw new TypeError(`invalid hex data: ${str}`);
	}
	return new Binary(str);
}
