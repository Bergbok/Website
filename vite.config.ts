import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vite.dev/config
export default defineConfig({
	appType: 'mpa',
	build: {
		chunkSizeWarningLimit: 4200
	},
	plugins: [
		vue({
			features: {
				optionsAPI: false
			}
		})
	]
});
