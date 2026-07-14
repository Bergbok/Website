<script setup lang="ts">
import './scene.css';
import sorrybro from '@assets/images/404.avif';
import keepdistance from '@assets/images/missing-texture.avif';
import { useFavicon } from '@composables/useFavicon';

useFavicon({ frames: [keepdistance] });
</script>

<template>
	<div class="scene scene-centered">
		<img
			:src="sorrybro"
			alt="404"
			title="sorry bro&#10;&#10;page is still being worked on&#10;&#10;keep distance" />
	</div>
</template>
