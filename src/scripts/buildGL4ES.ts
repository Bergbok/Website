import { resolve } from 'path';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '.cache/gl4es');
const execOptions: ExecSyncOptions = { stdio: 'inherit' };

export function ensureGL4ES(): string {
	if (!existsSync(ᱻ)) {
		mkdirSync(resolve(ᱻ, '..'), { recursive: true });
		execSync(`git clone --depth 1 https://github.com/ptitSeb/gl4es.git ${ᱻ}`, execOptions);

		const cmake = resolve(ᱻ, 'CMakeLists.txt');
		writeFileSync(
			cmake,
			readFileSync(cmake, 'utf8').replace(
				/(MATCHES\s+"Emscripten"[^\n]*\n\s*add_definitions\([^)]+)\)/,
				'$1 -fPIC)'
			),
			'utf8'
		);
	}

	if (!existsSync(resolve(ᱻ, 'lib/libGL.a'))) {
		const buildDir = resolve(ᱻ, 'build');
		mkdirSync(buildDir, { recursive: true });
		execSync('emcmake cmake .. -DCMAKE_BUILD_TYPE=RelWithDebInfo -DNOX11=ON -DNOEGL=ON -DSTATICLIB=ON', {
			...execOptions,
			cwd: buildDir
		});
		execSync('emmake make', { ...execOptions, cwd: buildDir });
	}

	return ᱻ;
}
