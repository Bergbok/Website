import { resolve } from 'path';
import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/spacecadetpinball');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };

export default function buildSpaceCadetPinball(): Plugin {
	return {
		name: 'build-spacecadetpinball',
		apply: 'build',
		async buildStart() {
			const cmakelists = resolve(ᱻ, 'CMakeLists.txt');
			writeFileSync(cmakelists, readFileSync(cmakelists, 'utf8').replace('-s DEMANGLE_SUPPORT=1', ''), 'utf8');

			if (existsSync(resolve(ᱻ, 'bin'))) {
				return;
			}

			if (!existsSync(resolve(ᱻ, 'out'))) {
				execSync('emcmake cmake -S . -B out -DCMAKE_BUILD_TYPE=Release', execOptions);
			}

			if (readdirSync(resolve(ᱻ, 'game_resources')).length <= 1) {
				execSync(
					'curl -fsSL https://archive.org/download/3-d-pinball-for-windows.-7z/3D%20Pinball%20for%20Windows.7z -o pinball.7z && 7z x pinball.7z -ogame_resources -aos && rm pinball.7z',
					execOptions
				);
			}

			execSync('cmake --build out', execOptions);
		}
	};
}
