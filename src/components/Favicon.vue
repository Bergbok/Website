<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef } from 'vue';

const favicon = useTemplateRef('favicon');

const frames = Object.values(
	import.meta.glob('../assets/images/favicon/frames/*.png', {
		eager: true,
		import: 'default'
	})
) as string[];

const fps = 24;
let currentFrame = 0;
let interval: number | undefined;

const updateFavicon = () => {
	const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
	const frame = frames[currentFrame];
	if (link && frame) {
		link.href = frame;
		currentFrame = (currentFrame + 1) % frames.length;
	}
};

onMounted(() => {
	interval = window.setInterval(updateFavicon, 1000 / fps);
	favicon.value?.remove();
});

onUnmounted(() => {
	if (interval !== undefined) {
		clearInterval(interval);
	}
});
</script>

<template>
	<div ref="favicon"></div>
</template>
