import { resolve } from 'path';
import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync, symlinkSync, writeFileSync } from 'fs';
import type { Plugin } from 'vite';

const ᱻ = resolve(import.meta.dirname, '../lib/oimo');
const stdio = 'inherit';

export default function buildOimo(): Plugin {
	return {
		name: 'build-oimo',
		apply: 'build',
		async buildStart() {
			const projects = readdirSync(ᱻ)
				.filter((name) => {
					const dir = resolve(ᱻ, name);
					return statSync(dir).isDirectory() && existsSync(resolve(dir, 'build.hxml'));
				})
				.toSorted();

			if (projects.every((p) => existsSync(resolve(ᱻ, p, 'bin/main.js')))) {
				return;
			}

			const libs = resolve(ᱻ, 'libs');
			for (const lib of readdirSync(libs)) {
				const libPath = resolve(libs, lib);
				if (!statSync(libPath).isDirectory()) {
					continue;
				}
				const target = resolve(ᱻ, lib);
				if (!existsSync(target)) {
					symlinkSync(libPath, target, 'dir');
				}
			}

			for (const project of projects) {
				const projectRoot = resolve(ᱻ, project);
				if (existsSync(resolve(projectRoot, 'bin/main.js'))) {
					continue;
				}

				console.log(`Building Oimo "${project}"...`);

				execSync('haxelib install build.hxml --always --quiet', { cwd: projectRoot });

				if (project === 'drops' && !existsSync(resolve(projectRoot, 'bin/a.wasm'))) {
					execSync('bun install', { cwd: resolve(projectRoot, 'as'), stdio });
					execSync('bun run asbuild:release', { cwd: resolve(projectRoot, 'as'), stdio });
				}

				if (project === 'water' && !existsSync(resolve(projectRoot, 'bin/main.wasm'))) {
					execSync('emcc -O3 --no-entry -msimd128 src/main.cpp -o ../bin/main.wasm', {
						cwd: resolve(projectRoot, 'wasm'),
						stdio
					});
				}

				if (project === 'jelly') {
					const shaderFile = resolve(projectRoot, 'src/ShaderPhys.hx');
					const original = readFileSync(shaderFile, 'utf8');
					const start = original.indexOf('class ComputeVelocityShader');
					const end = original.indexOf('\nclass ', start + 1);
					if (start === -1 || end === -1) {
						throw new Error('buildOimo: ComputeVelocityShader class not found in jelly/src/ShaderPhys.hx');
					}
					const patched =
						original.slice(0, start) +
						original.slice(start, end).replace(/\bc\b/g, 'cell') +
						original.slice(end);

					try {
						writeFileSync(shaderFile, patched);
						execSync('haxe build.hxml', { cwd: projectRoot, stdio });
					} finally {
						writeFileSync(shaderFile, original);
					}
				} else {
					execSync('haxe build.hxml', { cwd: projectRoot, stdio });
				}
			}
		}
	};
}
