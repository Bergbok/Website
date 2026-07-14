import { resolve } from 'path';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/celeste');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };

export default function buildCeleste(): Plugin {
	return {
		name: 'build-celeste',
		apply: 'build',
		async buildStart() {
			const makefile = resolve(ᱻ, 'Makefile');

			writeFileSync(
				makefile,
				readFileSync(makefile, 'utf8').replace(/^(\t\s*)pnpm(\b.*)$/gm, '$1bunx pnpm$2'),
				'utf8'
			);

			if (existsSync(resolve(ᱻ, 'frontend/dist'))) {
				return;
			}

			if (!existsSync(resolve(ᱻ, 'loader/bin'))) {
				execSync('sudo dotnet workload restore', {
					...execOptions,
					cwd: resolve(ᱻ, 'loader')
				});
			}

			execSync('bunx pnpm install --ignore-scripts', execOptions);
			execSync('make publish', execOptions);
		}
	};
}
