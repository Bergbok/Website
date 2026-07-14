<script setup lang="ts">
import { computed } from 'vue';
import { RoundedRect } from 'shaders/vue';
import { get, useWindowSize } from '@vueuse/core';
import { useSettingsStore } from '@store/settings.ts';
import { useBackgroundStore } from '@store/background.ts';
import { CUSTOM_BACKDROP, getBackdrop } from '@components/shaders';
import { useWallpaperFitStyle } from '@composables/useWallpaperFitStyle.ts';

const settings = useSettingsStore();
const backgroundStore = useBackgroundStore();

const preset = computed(() => backgroundStore.presetOverride ?? getBackdrop(settings.background));
const aspectRatio = computed(() => backgroundStore.aspectRatioOverride ?? 4 / 3);

const bgImage = computed(() => {
	if (!backgroundStore.presetOverride && settings.background === CUSTOM_BACKDROP) {
		return settings.customBackgroundUrl ? `url(${settings.customBackgroundUrl})` : 'none';
	}
	return `url(${get(preset).fallback.src})`;
});

const { width: vw, height: vh } = useWindowSize();
const veilWidth = computed(() => Math.min(get(vw), get(vh) * get(aspectRatio)) / get(vh) / 2);
const veilHeight = computed(() => Math.min(get(vh), get(vw) / get(aspectRatio)) / get(vh) / 2);

const fitStyle = useWallpaperFitStyle(() => settings.backgroundFit);
</script>

<template>
	<div id="background" :style="{ backgroundImage: bgImage, ...fitStyle }">
		<component
			:is="preset.shader"
			v-if="
				settings.enableShaders &&
				settings.enableBackgroundShader &&
				(backgroundStore.presetOverride || settings.background !== CUSTOM_BACKDROP)
			">
			<RoundedRect
				v-if="settings.enableWallpaperShader"
				:width="veilWidth"
				:height="veilHeight"
				:rounding="0"
				color="#000" />
		</component>
	</div>
</template>

<style scoped>
#background {
	inset: 0;
	position: fixed;
	z-index: -1;

	& :deep(.shader) {
		height: 100%;
	}
}
</style>
