import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { BackdropPreset } from '@components/shaders';

export const useBackgroundStore = defineStore('background', () => {
	const aspectRatioOverride = ref<number | null>(null);
	const presetOverride = ref<BackdropPreset | null>(null);

	function setOverride(preset: BackdropPreset | null, aspectRatio: number | null = null): void {
		presetOverride.value = preset;
		aspectRatioOverride.value = aspectRatio;
	}

	function clearOverride(): void {
		presetOverride.value = null;
		aspectRatioOverride.value = null;
	}

	return { aspectRatioOverride, presetOverride, setOverride, clearOverride };
});
