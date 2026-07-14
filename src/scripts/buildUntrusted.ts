import { resolve } from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/untrusted');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };

export default function buildUntrusted(): Plugin {
	return {
		name: 'build-untrusted',
		apply: 'build',
		async buildStart() {
			if (existsSync(resolve(ᱻ, 'scripts/build/untrusted.min.js'))) {
				return;
			}

			execSync('make release', execOptions);
		}
	};
}
