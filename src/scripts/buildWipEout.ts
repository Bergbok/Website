import { resolve } from 'path';
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/wipEout');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };

export default function buildWipEout(): Plugin {
	return {
		name: 'build-wipEout',
		apply: 'build',
		async buildStart() {
			if (existsSync(resolve(ᱻ, 'build/wasm'))) {
				return;
			}

			if (readdirSync(resolve(ᱻ, 'wipeout')).length <= 1) {
				execSync(
					'curl -fsSL https://phoboslab.org/files/wipeout-data-v01.zip -o wipeout.zip && unzip -o wipeout.zip && rm wipeout.zip',
					execOptions
				);
			}

			execSync('make wasm', execOptions);
			execSync(
				'bun wrangler r2 object put computer/wipeout.data --file=build/wasm/wipeout.data --remote',
				execOptions
			);
		}
	};
}
