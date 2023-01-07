import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import colors from "ansi-colors";
import benchmark from "benchmark";
import globby from "globby";
import createMatcher from "ignore";

import { setupSharedBuffer } from "../src/shared-buffers.js";

interface BenchModule {
	default?: (suite: benchmark.Suite) => void;
}

void (async () => {
	const matcher = createMatcher();
	const patterns = process.argv.slice(2);
	patterns.forEach(pattern => matcher.add(pattern));

	setupSharedBuffer(20000);

	const dirname = join(fileURLToPath(import.meta.url), "..");
	for (const filename of await globby("./**/*.bench.js", { cwd: dirname })) {
		const name = filename.replace(/\\/g, "/").replace(/\.bench\.js$/, "");
		if (patterns.length === 0 || matcher.ignores(name)) {
			const module = await import(pathToFileURL(join(dirname, filename)).toString()) as BenchModule;
			if (typeof module.default === "function") {
				await new Promise<void>((resolve, reject) => {
					const suite = new benchmark.Suite(name, {
						onStart() {
							console.log(colors.green(name));
						},
						onCycle(event: Event) {
							console.log(`  ${event.target}`);
						},
						onComplete() {
							console.log();
							resolve();
						},
						onError: reject,
					});
					module.default!(suite);
					if (suite.length === 0) {
						resolve();
					} else {
						suite.run({ async: true });
					}
				});
			}
		}
	}
})();
