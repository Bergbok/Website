<script setup lang="ts">
import 'unfonts.css';
import 'os-gui/build/layout.css';
import 'os-gui/build/windows-98.css';
import 'os-gui/build/windows-default.css';
import AFK from '@components/AFK.vue';
import FPS from '@components/FPS.vue';
import Cursor from '@components/Cursor.vue';
import Webamp from '@components/Webamp.vue';
import Background from '@components/Background.vue';
import kbjingle from '@assets/audio/void-stranger/sfx/kbjingle.opus?url';
import { Howl } from 'howler';
import { BONG, DEFAULT, say } from 'cowsay';
import { computed, watchEffect } from 'vue';
import { useHead, useSeoMeta } from '@unhead/vue';
import { useSettingsStore } from '@store/settings.ts';
import { useFavicon } from '@composables/useFavicon.ts';
import { useKonamiCode } from '@composables/useKonamiCode.ts';

const settings = useSettingsStore();

watchEffect(() => {
	document.documentElement.style.setProperty('--accent', settings.accentColor);
});

useHead({
	title: computed(() => settings.title),
	link: [
		{
			rel: 'license',
			title: 'ISC',
			href: 'https://github.com/Bergbok/Website/blob/main/LICENSE.md'
		},
		{
			rel: 'search',
			type: 'application/opensearchdescription+xml',
			title: 'Google󠄀',
			href: '/opensearch.xml'
		}
	]
});

useSeoMeta({
	author: 'Bergbok (https://github.com/Bergbok)',
	description: '( ͡° ͜ʖ ͡°)',
	ogType: 'website',
	ogUrl: '/',
	ogAudio: '/opengraph.opus',
	ogAudioType: 'audio/ogg',
	ogImage: '/opengraph.webp',
	ogImageType: 'image/avif',
	ogImageWidth: '1280',
	ogImageHeight: '640',
	ogSiteName: 'bergbok dot computer',
	ogLocale: 'en_ZA'
});

useFavicon();

useKonamiCode({
	callback: () =>
		new Howl({
			src: kbjingle,
			format: ['opus'],
			volume: 0.42
		}).play()
});

const date = new Date();

console.log(say({ text: 'hello', cow: date.getMonth() === 3 && date.getDate() === 20 ? BONG : DEFAULT }));
</script>

<template>
	<header>
		<FPS />
	</header>
	<main>
		<Background />
		<RouterView />
		<Cursor />
	</main>
	<footer>
		<AFK />
		<Webamp />
	</footer>
</template>

<style>
* {
	font-family: 'Departure Mono';
}

body {
	accent-color: var(--accent);
	background-color: #212121;

	&.cat * {
		font-family: 'Pussyfoot';
	}
}

.os-window.focused .window-titlebar {
	background: var(--accent) !important;
}
</style>
