import vue from '@vitejs/plugin-vue';
import unfonts from 'unplugin-fonts/vite';
import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import { generateCspPlugin } from 'vite-plugin-bun-csp';

// https://vite.dev/config
export default defineConfig({
	appType: 'mpa',
	build: {
		chunkSizeWarningLimit: 4200
	},
	plugins: [
		createHtmlPlugin({
			minify: {
				collapseWhitespace: false
			}
		}),
		generateCspPlugin({
			algorithm: 'sha512'
		}),
		unfonts({
			custom: {
				display: 'block',
				preload: true,
				families: [
					{
						name: 'fraps',
						src: './src/assets/fonts/fraps.woff2'
					}
				]
			}
		}),
		vue({
			features: {
				optionsAPI: false
			}
		})
	]
});
