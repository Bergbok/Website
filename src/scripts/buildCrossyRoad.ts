import { resolve } from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/crossyroad');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };

export default function buildCrossyRoad(): Plugin {
	return {
		name: 'build-crossyroad',
		apply: 'build',
		async buildStart() {
			if (existsSync(resolve(ᱻ, 'dist'))) {
				return;
			}

			execSync('bun install', execOptions);
			execSync(`yq -i '.expo.experiments.baseUrl = "/crossyroad"' app.json`, execOptions);
			execSync('bun run predeploy:web', execOptions);
		}
	};
}
