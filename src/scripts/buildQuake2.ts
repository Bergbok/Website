import { resolve } from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { ensureGL4ES } from './buildGL4ES.ts';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/quake2');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };

export default function buildQuake2(): Plugin {
	return {
		name: 'build-quake2',
		apply: 'build',
		async buildStart() {
			const baseq2 = resolve(ᱻ, 'wasm/baseq2');

			if (!existsSync(resolve(baseq2, 'pak0.pak'))) {
				execSync(
					`curl -fsSL https://github.com/Jason2Brownlee/Quake2OfficialArchive/raw/refs/heads/main/bin/q2-314-demo-x86.exe -o q2demo.exe && 7z e q2demo.exe 'Install/Data/baseq2/pak0.pak' -o${baseq2} && rm q2demo.exe`,
					{ cwd: ᱻ, stdio: 'inherit' }
				);
			}

			if (existsSync(resolve(ᱻ, 'release/index.wasm'))) {
				return;
			}

			const gl4esPath = ensureGL4ES();

			execSync(`emmake make GL4ES_PATH=${gl4esPath}`, execOptions);
			execSync(
				'bun wrangler r2 object put computer/quake2/index.data --file=release/index.data --remote',
				execOptions
			);
		}
	};
}
