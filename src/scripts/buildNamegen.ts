import { resolve } from 'path';
import { execSync } from 'child_process';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/namegen/src');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };

export default function buildNamegen(): Plugin {
	return {
		name: 'build-namegen',
		apply: 'build',
		async buildStart() {
			try {
				execSync('git diff --quiet HEAD -- bin/js/markov.js', execOptions);
			} catch {
				return;
			}

			execSync('haxe MarkovNames.hxml', execOptions);
		}
	};
}
