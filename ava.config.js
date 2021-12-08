"use strict";

export default {
	files: [
		"./test_out/test/**/*.js",
		"!**/_*/**"
	],
	ignoredByWatcher: [
		"./src/**/*",
		"./test/**/*",
	],
	require: [
		"./test_out/test/_common/env.js"
	],
	nodeArguments: [
		"--no-warnings"
	],
	concurrency: 4,
	verbose: true
}
