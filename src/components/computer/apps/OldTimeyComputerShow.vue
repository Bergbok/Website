<script setup lang="ts">
import 'video.js/dist/video-js.css';
import AppWindow from '@compunents/AppWindow.vue';
import { VideoPlayer } from '@videojs-player/vue';
import { useAppOpen } from '@composables/useApp.ts';

const { isOpen, appOpenListeners } = useAppOpen();
</script>

<template>
	<AppWindow app-i-d="otcs" v-on="appOpenListeners">
		<div id="player">
			<VideoPlayer
				aspect-ratio="4:3"
				:autoplay="isOpen ? 'any' : false"
				:controls="true"
				:sources="[{ src: 'https://otcs.minuspoint.com/hls/0/stream.m3u8', type: 'application/x-mpegURL' }]"
				:volume="0.5" />
		</div>
	</AppWindow>
</template>

<style scoped>
#player {
	background: #000;
	height: 100%;
	width: 100%;

	& :deep(.video-js) {
		height: 100%;
		width: 100%;
	}
}
</style>
