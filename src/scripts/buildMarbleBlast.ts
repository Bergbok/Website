import { resolve } from 'path';
import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import type { Plugin } from 'vite';

const ᱻ = resolve(import.meta.dirname, '../lib/marbleblast');
const haxeProjects = ['gold', 'platinum', 'ultra'];
const stdio = 'inherit';

function normalizeDataDir(dir: string): number {
	let count = 0;
	const fntRegex = /(\sfile=")([^"]+)(")/gi;

	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const fullPath = resolve(dir, entry.name);
		if (entry.isDirectory()) {
			count += normalizeDataDir(fullPath);
		} else if (entry.isFile() && entry.name.endsWith('.fnt')) {
			const content = readFileSync(fullPath, 'utf8');
			const updated = content.replace(fntRegex, (_, pfx, fn, sfx) => pfx + fn.toLowerCase() + sfx);
			if (updated !== content) {
				writeFileSync(fullPath, updated);
			}
		}

		const lowerName = entry.name.toLowerCase();
		if (lowerName !== entry.name) {
			renameSync(fullPath, resolve(dir, lowerName));
			count++;
		}
	}
	return count;
}

export default function buildMarbleBlast(): Plugin {
	return {
		name: 'build-marbleblast',
		apply: 'build',
		async buildStart() {
			const needsHaxeBuild = haxeProjects.some((p) => {
				const root = resolve(ᱻ, p);
				return existsSync(resolve(root, 'compile-js.hxml')) && !existsSync(resolve(root, 'marblegame.js'));
			});

			if (needsHaxeBuild) {
				for (const project of haxeProjects) {
					const projectRoot = resolve(ᱻ, project);
					if (existsSync(resolve(projectRoot, 'marblegame.js'))) {
						continue;
					}

					execSync('haxelib install compile-js.hxml --always --quiet', { cwd: projectRoot, stdio });
					execSync('haxelib git heaps https://github.com/RandomityGuy/heaps', { stdio });
					execSync('haxe compile-js.hxml', { cwd: projectRoot, stdio });
				}
			}

			for (const project of haxeProjects) {
				const dataDir = resolve(ᱻ, project, 'data');
				if (!existsSync(dataDir)) {
					continue;
				}
				normalizeDataDir(dataDir);
			}
		}
	};
}
