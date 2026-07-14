<script setup lang="ts">
import Webamp from 'webamp/butterchurn';
import { get } from '@vueuse/core';
import { onMounted, onUnmounted, useTemplateRef } from 'vue';
import { useWebampLayout } from '@composables/useWebampLayout.ts';
import {
	attachSkinPersistence,
	availableSkins,
	initialSkin,
	initialTracks,
	requireButterchurnPresets,
	useWebampStore
} from '@store/webamp.ts';

const webampStore = useWebampStore();
const container = useTemplateRef<HTMLElement>('container');
let webamp: Webamp | null = null;

const { getInitialWindowSizes, isDoubleSizeLayout, updateWindowLayout } = useWebampLayout(() => webamp, container);

let detachSkinPersistence: (() => void) | null = null;

onMounted(async () => {
	const initialSizes = getInitialWindowSizes();
	const position = { top: -9999, left: -9999 };
	const closed = true;

	detachSkinPersistence = attachSkinPersistence();

	webamp = new Webamp({
		availableSkins,
		enableDoubleSizeMode: isDoubleSizeLayout(),
		enableHotkeys: false,
		initialSkin,
		initialTracks,
		requireButterchurnPresets,
		windowLayout: {
			main: { position, closed },
			equalizer: { position, closed },
			milkdrop: { position, size: initialSizes.milkdrop, closed },
			playlist: { position, size: initialSizes.playlist, closed }
		},
		zIndex: 10
	});

	webampStore.setInstance(webamp);
	webamp.store.dispatch({ type: 'SET_VOLUME', volume: 50 });

	if (get(container)) {
		const mountContainer = get(container)!;
		try {
			await webamp.renderInto(mountContainer);
			const eventsDiv = document.querySelector('body > div:has(svg):has(defs)') as HTMLElement | null;
			if (eventsDiv) {
				const svg = eventsDiv.querySelector('svg');
				if (svg && svg.clientWidth === 0 && svg.clientHeight === 0) {
					eventsDiv.style.display = 'none';
					mountContainer.appendChild(eventsDiv);
				}
			}
			updateWindowLayout();
		} catch (error) {
			console.error('failed to render Webamp', error);
		}
	}
});

onUnmounted(() => {
	webamp?.dispose();
	webampStore.setInstance(null);
	detachSkinPersistence?.();
	webamp = null;
});
</script>

<template>
	<div id="webamp-container" ref="container"></div>
</template>

<style>
#webamp-container {
	height: 100%;
	position: relative;
	width: 100%;
}
</style>
