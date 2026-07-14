import { resolve } from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/thepowdertoy');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };

export default function buildThePowderToy(): Plugin {
	return {
		name: 'build-thepowdertoy',
		apply: 'build',
		async buildStart() {
			if (existsSync(resolve(ᱻ, 'build'))) {
				return;
			}
			execSync('uv venv --allow-existing', execOptions);
			execSync('source .venv/bin/activate', execOptions);
			execSync('uv pip install --quiet meson ninja', execOptions);
			execSync('meson setup build --cross-file=.github/emscripten-ghactions.ini -Dstatic=prebuilt', execOptions);
			execSync('meson compile -C build -v', execOptions);
		}
	};
}
