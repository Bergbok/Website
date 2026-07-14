// https://docs.godotengine.org/en/stable/engine_details/development/compiling/compiling_for_web.html#building-the-editor
import { resolve } from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/godot');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };

export default function buildGodot(): Plugin {
	return {
		name: 'build-godot',
		apply: 'build',
		async buildStart() {
			if (existsSync(resolve(ᱻ, 'bin/.web_zip'))) {
				return;
			}

			execSync('uv tool run scons platform=web target=editor use_closure_compiler=yes', execOptions);
			execSync(
				'bun wrangler r2 object put computer/godot.editor.wasm --file=bin/.web_zip/godot.editor.wasm --remote',
				execOptions
			);
		}
	};
}
