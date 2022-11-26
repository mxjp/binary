import { Readable } from "node:stream";

import { StreamDeserializer as Native } from "../stream-deserializer.js";
import { toWebReadableStream } from "./node-readable-stream.js";

/**
 * Utility for deserializing binary data from a stream.
 *
 * All API that is provided by an instance of this class may **NOT** be used in parallel.
 */
export class StreamDeserializer extends Native {
	constructor(stream: ReadableStream<Uint8Array> | Readable) {
		super(stream instanceof Readable ? toWebReadableStream(stream) : stream);
	}
}
