<script setup lang="ts">
import { computed } from 'vue';
import { get } from '@vueuse/core';
import { useSettingsStore } from '@store/settings.ts';
import { CUSTOM_BACKDROP, getBackdrop } from '@components/shaders';
import { useWallpaperFitStyle } from '@composables/useWallpaperFitStyle.ts';

const settings = useSettingsStore();
const preset = computed(() => getBackdrop(settings.wallpaper));

const bgImage = computed(() => {
	if (settings.wallpaper === CUSTOM_BACKDROP) {
		return settings.customWallpaperUrl ? `url(${settings.customWallpaperUrl})` : 'none';
	}
	return `url(${get(preset).fallback.src})`;
});

const fitStyle = useWallpaperFitStyle(() => settings.wallpaperFit);
</script>

<template>
	<div id="wallpaper" :style="{ backgroundImage: bgImage, ...fitStyle }">
		<component
			id="wallpaper-backdrop"
			:is="preset.shader"
			v-if="settings.enableShaders && settings.enableWallpaperShader && settings.wallpaper !== CUSTOM_BACKDROP" />
	</div>
</template>

<style scoped>
#wallpaper {
	background-position: center;
	background-size: cover;
	inset: 0;
	position: absolute;

	& #wallpaper-backdrop {
		position: absolute;
		inset: 0;
	}
}
</style>
