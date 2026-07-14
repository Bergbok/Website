<script setup lang="ts">
import AppWindow from '@compunents/AppWindow.vue';
import shapeSdfUrl from '@assets/images/sdf/pixel-icons/twitch.bin?url';
import { get } from '@vueuse/core';
import { useScript } from '@unhead/vue';
import { useAppOpen } from '@composables/useApp.ts';
import { nextTick, ref, useTemplateRef, watch } from 'vue';

const appWindowRef = useTemplateRef<InstanceType<typeof AppWindow>>('appWindow');
const { isOpen, appOpenListeners } = useAppOpen();

const scriptLoaded = ref(false);
const { onLoaded } = useScript('/twitch.js');
onLoaded(() => {
	scriptLoaded.value = true;
});

let player: Twitch.Player | null = null;

watch([isOpen, scriptLoaded], async ([opened]) => {
	if (!opened || !get(scriptLoaded) || player) {
		return;
	}

	const testFrame = document.createElement('iframe');
	if (!('credentialless' in testFrame) && window.crossOriginIsolated) {
		get(appWindowRef)?.close();
		window.open('https://www.twitch.tv/bergbok');
		return;
	}

	const livestreams = await fetch('/livestreams');
	await nextTick();
	const container = document.getElementById('player');
	if (!container) {
		return;
	}

	player = new Twitch.Player('player', {
		width: '100%',
		height: '100%',
		channel: ((await livestreams.json()) as { ttv: string[] }).ttv[0],
		autoplay: true,
		muted: false,
		parent: [window.location.hostname]
	});
	player.setVolume(0.5);

	const iframe = container.querySelector('iframe');
	if (iframe) {
		const src = iframe.getAttribute('src') ?? '';
		iframe.removeAttribute('src');
		// @ts-ignore
		iframe.credentialless = true;
		iframe.setAttribute('src', src);
	}
});
</script>

<template>
	<AppWindow
		ref="appWindow"
		app-i-d="twitch"
		:shader-options="{ glowColor: '#6441A4', shapeSdfUrl }"
		v-on="appOpenListeners">
		<div id="player" />
	</AppWindow>
</template>

<style scoped>
#player {
	width: 100%;
	height: 100%;
}
</style>
