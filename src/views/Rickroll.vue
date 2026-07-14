<script setup lang="ts">
import './scene.css';
import 'video.js/dist/video-js.css';
import { VideoPlayer } from '@videojs-player/vue';
import { useHead, useSeoMeta } from '@unhead/vue';

const url = '/rickroll.webm';
const type = 'video/webm';

useHead({
	title: ':)',
	link: [{ rel: 'preload', href: url, as: 'video', type }]
});

useSeoMeta({
	description: ':P',
	ogUrl: '/rickroll',
	ogVideo: url,
	ogVideoType: type,
	ogVideoWidth: 1920,
	ogVideoHeight: 1080
});
</script>

<template>
	<div class="scene">
		<div class="screen-4-3">
			<VideoPlayer
				aspect-ratio="4:3"
				autoplay="any"
				:controls="true"
				:loop="true"
				:sources="[{ src: url, type }]"
				:volume="0.8" />
		</div>
	</div>
</template>
