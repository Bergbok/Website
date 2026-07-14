<script setup lang="ts">
import './scene.css';
import 'video.js/dist/video-js.css';
import src from '@assets/video/fingal.webm';
import { VideoPlayer } from '@videojs-player/vue';
import { useHead, useSeoMeta } from '@unhead/vue';

const type = 'video/webm';

useHead({
	title: 'fingal',
	link: [{ rel: 'preload', href: src, as: 'video', type }]
});

useSeoMeta({
	description: 'fingal',
	ogUrl: '/fingal',
	ogVideo: src,
	ogVideoType: type,
	ogVideoWidth: 958,
	ogVideoHeight: 720
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
				:sources="[{ src, type }]"
				:volume="0.8" />
		</div>
	</div>
</template>
