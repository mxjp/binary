import { setGlobalAllocator, SharedBufferAllocator } from "@mpt/binary";
import Benchmark from "benchmark";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ctx = dirname(fileURLToPath(import.meta.url));

interface BenchModule {
	default: (suite: Benchmark.Suite) => void;
}

setGlobalAllocator(new SharedBufferAllocator(new ArrayBuffer(20_000)));

for (const name of await readdir(ctx)) {
	if (name.endsWith(".bench.js")) {
		const module = await import(pathToFileURL(join(ctx, name)).toString()) as BenchModule;
		console.group(name);
		await new Promise<void>((resolve, reject) => {
			const suite = new Benchmark.Suite(name, {
				onStart() {
				},
				onCycle(event: Event) {
					console.log(String(event.target));
				},
				onComplete() {
					console.log();
					resolve();
				},
				onError: reject,
			});
			module.default(suite);
			suite.run({ async: true });
		});
		console.groupEnd();
	}
}
