<script setup lang="ts">
import './scene.css';
import Grid from '@compunents/Grid.vue';
import Taskbar from '@compunents/Taskbar.vue';
import Wallpaper from '@compunents/Wallpaper.vue';
import ActivateWindows from '@compunents/ActivateWindows.vue';
import { provideDesktopContext } from '@composables/useDesktop.ts';

const { screenEl } = provideDesktopContext();
void screenEl;
</script>

<template>
	<div class="scene scene-app">
		<section ref="screenEl" id="screen" class="screen-4-3">
			<Wallpaper />
			<Grid />
			<Taskbar />
			<ActivateWindows />
		</section>
	</div>
</template>

<style scoped>
.screen-4-3 {
	--taskbar-h: clamp(28px, calc(3.4 * var(--su)), 52px);
}
</style>
