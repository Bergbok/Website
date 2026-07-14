<script setup lang="ts">
import { computed } from 'vue';

const { rect } = defineProps<{
	rect: {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	};
}>();

const selectionRectStyle = computed(() => ({
	left: `${rect.x1}px`,
	top: `${rect.y1}px`,
	width: `${rect.x2 - rect.x1}px`,
	height: `${rect.y2 - rect.y1}px`
}));
</script>

<template>
	<div id="selection-rect" :style="selectionRectStyle" />
</template>

<style scoped>
#selection-rect {
	background: color-mix(in srgb, var(--accent, #0a246a) 10%, transparent);
	border: 2px dotted var(--accent, #0a246a);
	box-shadow: inset 0 0 0 1px var(--accent, #0a246a);
	box-sizing: border-box;
	pointer-events: none;
	position: absolute;
	z-index: 1;
}
</style>
