import vue from '@vitejs/plugin-vue';
import unfonts from 'unplugin-fonts/vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import buildNoclip from './src/scripts/buildNoclip.ts';
import patchSubmodules from './src/scripts/patchSubmodules.ts';
import buildBassoonTracker from './src/scripts/buildBassoonTracker.ts';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { Unhead as unhead } from '@unhead/vue/vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import { cloudflare } from '@cloudflare/vite-plugin';

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
	plugins: [
		command === 'build' && buildBassoonTracker(),
		command === 'build' && buildNoclip(),
		command === 'build' &&
			createHtmlPlugin({
				minify: {
					collapseWhitespace: false
				}
			}),
		cloudflare(),
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
						src: './src/assets/fonts/Departure Mono/default.woff2'
					},
					{
						name: 'Fraps',
						fallback: {
							category: 'sans-serif'
						},
						src: './src/assets/fonts/fraps.woff2'
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
			'@views': resolve(ᱻ, 'src/views'),
			'App.vue': resolve(ᱻ, 'src/App.vue'),
			'shaders/vue': resolve(ᱻ, 'src/lib/shaders.ts'),
			'shaders': resolve(ᱻ, 'node_modules/shaders/dist/vue/index.js')
		}
	},
	server: {
		headers: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'credentialless'
		},
		proxy: {
			'/twitch.js': {
				target: 'https://player.twitch.tv',
				changeOrigin: true,
				rewrite: (): string => '/js/embed/v1.js'
			}
		}
	}
}));
