import type { Readable } from "node:stream";

export function toWebReadableStream(source: Readable): ReadableStream<Uint8Array> {
	let resolvePull: (() => void) | undefined;
	let controller: ReadableStreamController<Uint8Array>;

	function onError(error: unknown) {
		controller.error(error);
		resolvePull?.();
	}

	function onData(chunk: unknown) {
		source.pause();
		if (chunk instanceof Uint8Array) {
			controller.enqueue(chunk);
			resolvePull?.();
		} else {
			onError(new TypeError("unsupported chunk type"));
		}
	}

	function onEnd() {
		controller.close();
		resolvePull?.();
	}

	source.on("error", onError);
	source.on("data", onData);
	source.on("end", onEnd);

	source.on("close", () => {
		source.off("error", onError);
		source.off("data", onData);
		source.off("end", onEnd);
	});

	source.pause();

	return new ReadableStream({
		start(c) {
			controller = c;
		},

		cancel(reason) {
			source.destroy(reason as Error);
		},

		pull(_controller) {
			if (!source.readableEnded) {
				return new Promise<void>(resolve => {
					resolvePull = resolve;
					source.resume();
				});
			}
		},
	});
}
