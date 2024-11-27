import { ReadableStream, WritableStream } from "node:stream/web";

if (!globalThis.ReadableStream) {
	globalThis.ReadableStream = ReadableStream as typeof globalThis.ReadableStream;
}
if (!globalThis.WritableStream) {
	globalThis.WritableStream = WritableStream as typeof globalThis.WritableStream;
}
