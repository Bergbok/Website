import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';

// https://vite.dev/config
export default defineConfig({
	appType: 'mpa',
	build: {
		chunkSizeWarningLimit: 4200
	},
	plugins: [
		createHtmlPlugin({
			inject: {
				tags: [
					{
						tag: 'script',
						injectTo: 'head',
						attrs: {
							defer: true,
							src: 'https://static.cloudflareinsights.com/beacon.min.js',
							'data-cf-beacon': '{"token": "10d08d6922c543a48fc40e5bde43611b"}'
						}
					}
				]
			},
			minify: {
				collapseWhitespace: false
			}
		}),
		vue({
			features: {
				optionsAPI: false
			}
		})
	]
});
