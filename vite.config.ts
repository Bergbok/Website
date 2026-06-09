import vue from '@vitejs/plugin-vue';
import unfonts from 'unplugin-fonts/vite';
import buildRSS from './src/scripts/buildRSS.ts';
import buildDoom from './src/scripts/buildDoom.ts';
import buildOimo from './src/scripts/buildOimo.ts';
import vueDevTools from 'vite-plugin-vue-devtools';
import buildGodot from './src/scripts/buildGodot.ts';
import buildQuake from './src/scripts/buildQuake.ts';
import buildQuake2 from './src/scripts/buildQuake2.ts';
import buildDiablo from './src/scripts/buildDiablo.ts';
import buildNoclip from './src/scripts/buildNoclip.ts';
import buildCeleste from './src/scripts/buildCeleste.ts';
import buildWipEout from './src/scripts/buildWipEout.ts';
import buildOpenRCT2 from './src/scripts/buildOpenRCT2.ts';
import patchSubmodules from './src/scripts/patchSubmodules.ts';
import buildThePowderToy from './src/scripts/buildThePowderToy.ts';
import buildAnimalCrossing from './src/scripts/buildAnimalCrossing.ts';
import buildBassoonTracker from './src/scripts/buildBassoonTracker.ts';
import buildSpaceCadetPinball from './src/scripts/buildSpaceCadetPinball.ts';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { Unhead as unhead } from '@unhead/vue/vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import { cloudflare } from '@cloudflare/vite-plugin';
import { cloudflareRedirect } from 'vite-plugin-cloudflare-redirect';

const ᱻ = import.meta.dirname;

// https://vite.dev/config
export default defineConfig(({ command }) => ({
	appType: 'spa',
	build: {
		chunkSizeWarningLimit: 6969,
		cssMinify: 'esbuild',
		rolldownOptions: {
			checks: {
				pluginTimings: false
			},
			onLog(level, log, handler): void {
				if (log.message.includes('v86') && log.message.includes('externalized')) {
					return;
				}
				handler(level, log);
			}
		}
	},
	define: {
		global: 'globalThis'
	},
	plugins: [
		command === 'build' && buildSpaceCadetPinball(),
		command === 'build' && buildBassoonTracker(),
		command === 'build' && buildAnimalCrossing(),
		command === 'build' && buildThePowderToy(),
		command === 'build' && buildOpenRCT2(),
		command === 'build' && buildWipEout(),
		command === 'build' && buildCeleste(),
		command === 'build' && buildDiablo(),
		command === 'build' && buildNoclip(),
		command === 'build' && buildQuake2(),
		command === 'build' && buildQuake(),
		command === 'build' && buildGodot(),
		command === 'build' && buildDoom(),
		command === 'build' && buildOimo(),
		command === 'build' && buildRSS(),
		command === 'build' &&
			createHtmlPlugin({
				minify: {
					collapseWhitespace: false
				}
			}),
		cloudflare(),
		cloudflareRedirect(),
		patchSubmodules(),
		unfonts({
			inlineFontFace: true,
			custom: {
				display: 'block',
				preload: true,
				families: [
					{
						name: 'Departure Mono',
						fallback: {
							category: 'monospace'
						},
						local: 'Departure Mono Nerd Font',
						src: './src/assets/fonts/departure-mono.woff2'
					},
					{
						name: 'Fraps',
						fallback: {
							category: 'sans-serif'
						},
						src: './src/assets/fonts/fraps.woff2'
					},
					{
						name: 'Pussyfoot',
						fallback: {
							category: 'sans-serif'
						},
						src: './src/assets/fonts/pussyfoot.woff2'
					}
				]
			}
		}),
		vue({
			features: {
				optionsAPI: false
			}
		}),
		unhead(),
		vueDevTools()
	],
	resolve: {
		alias: {
			'@assets': resolve(ᱻ, 'src/assets'),
			'@components': resolve(ᱻ, 'src/components'),
			'@composables': resolve(ᱻ, 'src/composables'),
			'@compunents': resolve(ᱻ, 'src/components/computer'),
			'@lib': resolve(ᱻ, 'src/lib'),
			'@os-gui': resolve(ᱻ, 'src/components/computer/os-gui/index.ts'),
			'@router': resolve(ᱻ, 'src/router/router.ts'),
			'@scripts': resolve(ᱻ, 'src/scripts'),
			'@store': resolve(ᱻ, 'src/store'),
			'@typings': resolve(ᱻ, 'src/types'),
			'@views': resolve(ᱻ, 'src/views'),
			'App.vue': resolve(ᱻ, 'src/App.vue'),
			'gl-bench': resolve(ᱻ, 'node_modules/gl-bench/dist/gl-bench.module.js'),
			'shaders/vue': resolve(ᱻ, 'src/lib/shaders.ts'),
			'shaders': resolve(ᱻ, 'node_modules/shaders/dist/vue/index.js')
		}
	},
	server: {
		headers: {
			'Cross-Origin-Embedder-Policy': 'credentialless',
			'Cross-Origin-Opener-Policy': 'same-origin'
		}
	}
}));
