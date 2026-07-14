import { build } from 'vite';
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { version } from '../lib/bassoontracker/package.json';
import type { Plugin } from 'vite';

const ᱻ = resolve(import.meta.dirname, '../lib/bassoontracker');

export default function buildBassoonTracker(): Plugin {
	return {
		name: 'build-bassoontracker',
		apply: 'build',
		async buildStart() {
			await build({
				root: ᱻ,
				base: './',
				build: {
					assetsDir: '',
					outDir: 'build',
					rollupOptions: {
						input: {
							main: resolve(ᱻ, 'dev.html')
						}
					}
				},
				plugins: [
					{
						name: 'copy-index-html',
						apply: 'build',
						writeBundle(): void {
							const srcPath = resolve(ᱻ, 'build/dev.html');
							const destPath = resolve(ᱻ, 'index.html');
							let content = readFileSync(srcPath, 'utf8');
							content = content.replaceAll('./main', './build/main');
							content = content.replaceAll(/manifest-\w+\.json/gm, 'manifest.json');

							const date = new Date();
							const year = date.getFullYear();
							const month = String(date.getMonth() + 1).padStart(2, '0');
							const day = String(date.getDate()).padStart(2, '0');
							const buildNumber = `${version}_${year}${month}${day}_${Math.random().toString().slice(2, 10)}`;

							content = content.replace('{version}', version);
							content = content.replaceAll('{build}', buildNumber);
							content = content.replace('.js"', `.js?v=${buildNumber}"`);

							writeFileSync(destPath, content);
						}
					}
				]
			});
		}
	};
}
