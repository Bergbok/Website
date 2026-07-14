<script setup lang="ts">
import cursor from '@assets/images/cursor.png';
import { get } from '@vueuse/core';
import { iggyCursor } from 'iggy-cursor';
import { ghostCursor } from 'cursor-effects';
import { onMounted, onUnmounted, useTemplateRef } from 'vue';
import type { Iggy } from 'iggy-cursor';
import type { CursorEffectResult } from 'cursor-effects';

const iggyContainerRef = useTemplateRef<HTMLDivElement>('iggyContainer');
const effectsContainerRef = useTemplateRef<HTMLDivElement>('effectsContainer');
let effects: CursorEffectResult | null = null;
let iggy: Iggy | null = null;

onMounted(() => {
	const iggyContainer = get(iggyContainerRef);
	const effectsContainer = get(effectsContainerRef);
	if (!iggyContainer || !effectsContainer) {
		return;
	}

	iggy = iggyCursor({
		assetsBase: '/iggy/',
		parent: iggyContainer
	});

	const cursorTracker = iggyContainer.querySelector<HTMLDivElement>('.cursor');
	if (cursorTracker) {
		cursorTracker.style.backgroundImage = '';
	}

	iggy.events.addEventListener('ate', () => {
		document.body.style.cursor = 'none';
	});

	iggy.events.addEventListener('unate', () => {
		document.body.style.cursor = '';
	});

	effects = ghostCursor({ image: cursor });
	const canvas = document.querySelector<HTMLCanvasElement>('body > canvas:last-of-type');
	if (canvas) {
		effectsContainer.appendChild(canvas);
	}
});

onUnmounted(() => {
	iggy?.destroy();
	effects?.destroy();
});
</script>

<template>
	<div id="cursor">
		<div ref="iggyContainer" id="iggy"></div>
		<div ref="effectsContainer" id="cursor-effects"></div>
	</div>
</template>

<style scoped>
#iggy,
#cursor-effects {
	height: 100%;
	left: 0;
	pointer-events: none;
	position: fixed;
	top: 0;
	width: 100%;
	z-index: 1;
}
</style>
