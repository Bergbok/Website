<script setup lang="ts">
import { useFps } from '@vueuse/core';

const fps = useFps();
</script>

<template>
	<p id="fps">{{ fps }}</p>
</template>

<style scoped>
#fps {
	color: yellow;
	font-family: 'Fraps';
	font-size: 3rem;
	pointer-events: none;
	position: absolute;
	right: 1rem;
	top: -7rem;
	z-index: 1;
	-webkit-text-stroke: 0.1rem black;
}
</style>
