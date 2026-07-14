import { resolve } from 'path';
import { execSync } from 'child_process';
import { ensureGL4ES } from './buildGL4ES.ts';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/quake/WinQuake');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };

export default function buildQuake(): Plugin {
	return {
		name: 'build-quake',
		apply: 'build',
		async buildStart() {
			if (readdirSync(resolve(ᱻ, 'id1')).length <= 3) {
				execSync(
					'curl -fsSL https://github.com/lavenderdotpet/LibreQuake/releases/latest/download/lite.zip -o quake.zip && bsdtar -xf quake.zip -C id1 --strip-components 2 lite/id1 && rm quake.zip',
					execOptions
				);
			}

			if (existsSync(resolve(ᱻ, 'index.wasm')) && existsSync(resolve(ᱻ, 'gl/index.wasm'))) {
				return;
			}

			execSync('make -f Makefile.emscripten', execOptions);

			const gl4esPath = ensureGL4ES();
			mkdirSync(resolve(ᱻ, 'gl'), { recursive: true });
			execSync('find . -maxdepth 1 -name "*.o" -delete', execOptions);
			execSync(`make -f Makefile.emscripten TARGET=gl/index.html GL4ES_PATH=${gl4esPath}`, execOptions);

			for (const file of ['index.data', 'id1/pak0.pak', 'gl/index.data']) {
				execSync(`bun wrangler r2 object put computer/quake/${file} --file=${file} --remote`, execOptions);
			}
		}
	};
}
