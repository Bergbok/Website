import { resolve } from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/noclip');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };
const PUBLIC_STORAGE_URL = 'https://bergbok.computer/noclip/assets';

export default function buildNoclip(): Plugin {
	return {
		name: 'build-noclip',
		apply: 'build',
		async buildStart() {
			if (existsSync(resolve(ᱻ, 'dist'))) {
				return;
			}

			execSync('rustup target add wasm32-unknown-unknown', execOptions);
			execSync('cargo install cargo-run-bin && cargo bin --install', { ...execOptions, cwd: resolve(ᱻ, 'rust') });
			execSync('bunx pnpm install', execOptions);
			execSync('bunx pnpm run build:wasm-release', execOptions);
			execSync(
				`PUBLIC_STORAGE_URL=${PUBLIC_STORAGE_URL} bunx pnpm exec rsbuild build --config ../../../rsbuild.config.ts`,
				execOptions
			);
		}
	};
}
