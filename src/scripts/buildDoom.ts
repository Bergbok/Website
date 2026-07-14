import { resolve } from 'path';
import { existsSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { ensureGL4ES } from './buildGL4ES.ts';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/doom');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };

async function freedoomUrl(): Promise<string> {
	const res = await fetch('https://api.github.com/repos/freedoom/freedoom/releases/latest');
	const data = (await res.json()) as { assets: { name: string; browser_download_url: string }[] };
	const asset = data.assets.find((a) => a.name.startsWith('freedoom-') && a.name.endsWith('.zip'));
	if (!asset) {
		throw new Error('Could not find freedoom zip in latest release');
	}
	return asset.browser_download_url;
}

export default function buildDoom(): Plugin {
	return {
		name: 'build-doom',
		apply: 'build',
		async buildStart() {
			const wadDir = resolve(ᱻ, 'wasm/fs');
			const prboomxWad = resolve(wadDir, 'prboomx.wad');
			const wadAlreadyPresent = existsSync(resolve(wadDir, 'freedoom1.wad'));
			const prboomxAlreadyPresent = existsSync(prboomxWad);

			if (!prboomxAlreadyPresent) {
				execSync(
					'cmake -S . -B build_native -DCMAKE_BUILD_TYPE=Release && cmake --build build_native --target prboomwad',
					execOptions
				);
				execSync(`cp build_native/prboomx.wad ${prboomxWad}`, execOptions);
				for (const file of ['index.html', 'index.js', 'index.wasm', 'index.data']) {
					rmSync(resolve(ᱻ, `build/${file}`), { force: true });
				}
			}

			if (!wadAlreadyPresent) {
				const url = await freedoomUrl();
				execSync(
					`curl -fsSL ${url} -o freedoom.zip && unzip -j freedoom.zip '*/freedoom1.wad' '*/freedoom2.wad' -d ${wadDir} && rm freedoom.zip`,
					execOptions
				);
			}

			if (prboomxAlreadyPresent && wadAlreadyPresent && existsSync(resolve(ᱻ, 'build/index.html'))) {
				return;
			}

			const gl4esPath = ensureGL4ES();
			execSync(
				`mkdir -p build && emcmake cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DGL4ES_PATH=${gl4esPath}`,
				{
					cwd: ᱻ,
					stdio: 'inherit'
				}
			);
			execSync('cmake --build build', execOptions);

			execSync(
				'bun wrangler r2 object put computer/doom/index.data --file=build/index.data --remote',
				execOptions
			);
		}
	};
}
