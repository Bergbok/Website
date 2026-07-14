import process from 'process';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import type { Plugin } from 'vite';
import type { ExecSyncOptions } from 'child_process';

const ᱻ = resolve(import.meta.dirname, '../lib/openrct2');
const execOptions: ExecSyncOptions = { cwd: ᱻ, stdio: 'inherit' };
const gxc = {
	path: resolve(import.meta.dirname, '.cache/gxc'),
	url: 'https://github.com/OpenRCT2/libsawyer/releases/download/v1.4.0/libsawyer-tools-linux-x64.tar.gz'
};

function assetUrls(): { objects: string; titleSequences: string } {
	const json = JSON.parse(readFileSync(resolve(ᱻ, 'assets.json'), 'utf8'));
	return { objects: json.objects.url, titleSequences: json['title-sequences'].url };
}

export default function builOpenRCT2(): Plugin {
	return {
		name: 'build-openrct2',
		apply: 'build',
		async buildStart() {
			if (!existsSync(resolve(ᱻ, 'build'))) {
				execSync(
					`docker run --rm -w /w -v ${ᱻ}:/w -it ghcr.io/openrct2/openrct2-build:26-emscripten bash -c '. scripts/setenv && build-emscripten'`,
					execOptions
				);
			}

			const assetsZip = resolve(ᱻ, 'build/www/assets.zip');
			if (!existsSync(assetsZip)) {
				if (!existsSync(resolve(gxc.path, 'gxc'))) {
					mkdirSync(gxc.path, { recursive: true });
					execSync(`curl -fsSL ${gxc.url} | tar -xz -C ${gxc.path}`, { stdio: 'inherit' });
				}

				const datDir = resolve(ᱻ, 'data');
				mkdirSync(datDir, { recursive: true });
				execSync(`PATH=${gxc.path}:$PATH ${ᱻ}/scripts/build-graphics-dat ${datDir}`, { stdio: 'inherit' });

				const { objects: objectsUrl, titleSequences: seqUrl } = assetUrls();
				execSync(
					`curl -fsSL ${objectsUrl} -o ${datDir}/objects.zip && unzip -q ${datDir}/objects.zip -d ${datDir}/object && rm ${datDir}/objects.zip`,
					{ stdio: 'inherit' }
				);
				execSync(
					`curl -fsSL ${seqUrl} -o ${datDir}/sequences.zip && mkdir -p ${datDir}/sequence && unzip -q ${datDir}/sequences.zip -d ${datDir}/sequence && rm ${datDir}/sequences.zip`,
					{ stdio: 'inherit' }
				);

				const git = (cmd: string): string => execSync(cmd, { cwd: ᱻ, stdio: 'pipe' }).toString().trim();
				const tag = git(`git describe HEAD | sed -E 's/-g.+$//'`);
				const sha = git('git rev-parse --short HEAD');
				const branch = git('git rev-parse --abbrev-ref HEAD');
				const version = `OpenRCT2, ${tag} (${sha} on ${branch})`;

				execSync(
					`docker run --rm -e VERSION_STRING -v ${ᱻ}:/w -v ${datDir}:/dat ghcr.io/openrct2/openrct2-build:26-emscripten bash -c 'printf "%s" "$VERSION_STRING" > /tmp/version && cd /w/data && zip -r /w/build/www/assets.zip . && cd /dat && zip -r /w/build/www/assets.zip object sequence && zip -j /w/build/www/assets.zip /dat/*.dat /tmp/version'`,
					{ ...execOptions, env: { ...process.env, VERSION_STRING: version } }
				);
			}
		}
	};
}
