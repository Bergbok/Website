import { resolve } from 'path';
import { execSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import type { Plugin } from 'vite';

const ᱻ = resolve(import.meta.dirname, '../lib/bathbomb');
const cacheDir = resolve(import.meta.dirname, '.cache/haxe');
const stdio = 'inherit';

function ensureHaxe321(): { haxe: string; std: string } {
	const haxeDir = resolve(cacheDir, 'haxe-3.2.1');
	const haxeBin = resolve(haxeDir, 'haxe');
	const haxeStd = resolve(haxeDir, 'std');

	if (existsSync(haxeBin)) {
		return { haxe: haxeBin, std: haxeStd };
	}

	mkdirSync(cacheDir, { recursive: true });

	const url = 'https://github.com/HaxeFoundation/haxe/releases/download/3.2.1/haxe-3.2.1-linux64.tar.gz';
	const tarPath = resolve(cacheDir, 'haxe-3.2.1.tar.gz');

	execSync(`curl -fsSL "${url}" -o "${tarPath}"`, { stdio: 'pipe' });
	execSync(`tar -xzf "${tarPath}" -C "${cacheDir}"`, { stdio: 'pipe' });

	if (!existsSync(haxeBin)) {
		throw new Error(`downloading haxe 3.2.1 extraction failed`);
	}

	return { haxe: haxeBin, std: haxeStd };
}

export default function buildBathBomb(): Plugin {
	return {
		name: 'build-bathbomb',
		apply: 'build',
		async buildStart() {
			const haxe321: { haxe: string; std: string } = ensureHaxe321();
			const haxeEnv = { ...process.env, HAXE_STD_PATH: haxe321.std };

			const bathbombBin = resolve(ᱻ, 'bin');
			const bathbombJs = resolve(bathbombBin, 'GPUFluid.js');

			if (!existsSync(bathbombJs)) {
				mkdirSync(bathbombBin, { recursive: true });
				mkdirSync(resolve(bathbombBin, 'lib'), { recursive: true });
				mkdirSync(resolve(bathbombBin, 'images'), { recursive: true });

				execSync(
					`"${haxe321.haxe}"` +
						` -cp "src"` +
						` -cp "lib"` +
						' -main SnowApp' +
						` -js "bin/GPUFluid.js"` +
						' -D snow -D analyzer -D snow_web -D snow_module_audio_howlerjs' +
						' -dce full' +
						" --macro \"snow.system.module.Module.set('Audio','snow.modules.howlerjs.Audio')\"" +
						" --macro \"snow.system.module.Module.set('IO','snow.core.web.io.IO')\"" +
						" --macro \"snow.system.module.Module.set('Input','snow.core.web.input.Input')\"" +
						" --macro \"snow.system.module.Module.set('Windowing','snow.core.web.window.Windowing')\"" +
						" --macro \"snow.system.module.Module.set('Assets','snow.core.web.assets.Assets')\"",
					{ cwd: ᱻ, stdio, env: haxeEnv }
				);

				copyFileSync(resolve(ᱻ, 'config.json'), resolve(bathbombBin, 'config.json'));
				copyFileSync(resolve(ᱻ, 'flow/web/lib/howler.min.js'), resolve(bathbombBin, 'lib/howler.js'));

				const imagesDir = resolve(ᱻ, 'templates/web/images');
				for (const img of readdirSync(imagesDir)) {
					copyFileSync(resolve(imagesDir, img), resolve(bathbombBin, 'images', img));
				}

				let html = readFileSync(resolve(ᱻ, 'templates/web/index.html'), 'utf8');
				html = html.replace(
					/\{\{#each project\.app\.web\.libs~\}\}[\s\S]*?\{\{\/each\}\}/,
					'<script type="text/javascript" src="./lib/howler.js"></script>'
				);
				html = html.replace(/\{\{project\.app\.name\}\}/g, 'GPUFluid');
				html = html.replace(/\{\{#if project\.app\.web\.min\}\}\.min\{\{\/if\}\}/g, '');
				writeFileSync(resolve(bathbombBin, 'index.html'), html);
			}
		}
	};
}
