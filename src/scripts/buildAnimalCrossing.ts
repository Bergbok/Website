import { resolve } from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/animalcrossing');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };

export default function buildAnimalCrossing(): Plugin {
	return {
		name: 'build-animalcrossing',
		apply: 'build',
		async buildStart() {
			if (existsSync(resolve(ᱻ, 'pc/build-web/web/index.wasm'))) {
				return;
			}

			if (!existsSync(resolve(ᱻ, 'pc/build-web'))) {
				execSync('emcmake cmake -S pc -B pc/build-web -DCMAKE_BUILD_TYPE=Release', execOptions);
			}

			execSync(`emmake make -C pc/build-web`, execOptions);
		}
	};
}
