
export function createReadableChunks(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
	return new ReadableStream({
		start(controller: ReadableStreamDefaultController<Uint8Array>) {
			for (let i = 0; i < chunks.length; i++) {
				controller.enqueue(chunks[i]);
			}
			controller.close();
		}
	});
}
