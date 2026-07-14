import App from 'App.vue';
import router from '@router';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createHead } from '@unhead/vue/client';
import { CanonicalPlugin, InferSeoMetaPlugin } from '@unhead/vue/plugins';

const app = createApp(App);
const head = createHead({
	plugins: [
		CanonicalPlugin({
			canonicalHost: 'https://bergbok.computer'
		}),
		InferSeoMetaPlugin()
	]
});
const pinia = createPinia();

app.use(head);
app.use(pinia);
app.use(router);
app.mount(document.body);
