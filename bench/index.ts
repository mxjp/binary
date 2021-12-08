import { Suite } from "benchmark";
import globby from "globby";
import { join } from "path";
import createMatcher from "ignore";
import colors from "ansi-colors";

interface BenchModule {
	default?: (suite: Suite) => void;
}

(async () => {
	const matcher = createMatcher();
	const patterns = process.argv.slice(2);
	patterns.forEach(pattern => matcher.add(pattern));

	for (const filename of await globby("./**/*.bench.js", { cwd: __dirname })) {
		const name = filename.replace(/\\/g, "/").replace(/\.bench\.js$/, "");
		if (patterns.length === 0 || matcher.ignores(name)) {
			const module = await import(join(__dirname, filename)) as BenchModule;
			if (typeof module.default === "function") {
				await new Promise<void>((resolve, reject) => {
					const suite = new Suite(name, {
						onStart() {
							console.log(colors.green(name));
						},
						onCycle(e: Event) {
							console.log(`  ${e.target}`);
						},
						onComplete() {
							console.log();
							resolve();
						},
						onError: reject
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
