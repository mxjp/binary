import { Serializer } from "@mpt/binary";
import type { Suite } from "benchmark";

export default function (suite: Suite): void {
	function add(title: string, byteLength: number, prepare: (s: Serializer, byteLength: number) => void) {
		const buffer = new ArrayBuffer(byteLength);

		suite.add(`${buffer.byteLength} bytes (${title})`, () => {
			const s = new Serializer();
			prepare(s, byteLength);
			s.serialize(buffer);
		});

		suite.add(`${buffer.byteLength} bytes (${title}, prepare only)`, () => {
			const s = new Serializer();
			prepare(s, byteLength);
		});

		const serializeOnly = new Serializer();
		prepare(serializeOnly, byteLength);

		suite.add(`${byteLength} bytes (${title}, serialize only)`, () => {
			serializeOnly.serialize(buffer);
		});
	}

	add(
		"1 byte parts",
		0x10000,
		(s, byteLength) => {
			for (let i = 0; i < byteLength; i++) {
				s.uint8(0x42);
			}
		}
	);

	add(
		"1 byte parts",
		0x100000,
		(s, byteLength) => {
			for (let i = 0; i < byteLength; i++) {
				s.uint8(0x42);
			}
		}
	);

	add(
		"1x4, 1x2 2x1 byte parts",
		0x100000,
		(s, byteLength) => {
			for (let i = 0; i < byteLength; i += 8) {
				s.uint32(0x12345678);
				s.uint16(0x1234);
				s.uint8(0x12);
				s.uint8(0x34);
			}
		}
	);
}
