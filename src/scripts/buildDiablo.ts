import { resolve } from 'path';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/diablo');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };

export default function buildDiablo(): Plugin {
	return {
		name: 'build-diablo',
		apply: 'build',
		async buildStart() {
			const viteConfig = resolve(ᱻ, 'vite.config.js');
			writeFileSync(viteConfig, readFileSync(viteConfig, 'utf8').replaceAll('/OpenTristam', '/diablo'), 'utf8');

			if (!existsSync(resolve(ᱻ, 'node_modules'))) {
				execSync('bun install', execOptions);
			}

			if (!existsSync(resolve(ᱻ, 'build'))) {
				execSync('bun run build', execOptions);
			}

			if (!existsSync(resolve(ᱻ, 'build/spawn.mpq'))) {
				execSync('curl -fsSL https://d07riv.github.io/diabloweb/spawn.mpq -o build/spawn.mpq', execOptions);
			}
		}
	};
}
