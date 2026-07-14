<script setup lang="ts">
import GpuWindow from '@compunents/GpuWindow.vue';
import { get } from '@vueuse/core';
import { MENU_DIVIDER, MenuBar } from '@os-gui';
import { computed, defineAsyncComponent, provide, ref } from 'vue';

const exampleComponents = {
	physarum: defineAsyncComponent(async () => import('@compunents/gpuio/Physarum.vue')),
	gol: defineAsyncComponent(async () => import('@compunents/gpuio/GameOfLife.vue')),
	fractal: defineAsyncComponent(async () => import('@compunents/gpuio/Fractal.vue')),
	reactiondiffusion: defineAsyncComponent(async () => import('@compunents/gpuio/ReactionDiffusion.vue')),
	fluid: defineAsyncComponent(async () => import('@compunents/gpuio/Fluid.vue'))
} as const;

type ExampleID = keyof typeof exampleComponents;

const activeExample = ref<ExampleID>('physarum');
const currentComponent = computed(() => exampleComponents[get(activeExample)]);

const actions = ref<{ applyPreset?: (name: string) => void }>({});
provide('gpuio-actions', get(actions));

const showControls = ref(true);
provide('gpuio-showControls', showControls);

const physarumPresets = ['Fibers', 'Fingerprint', 'Honeycomb', 'Net', 'Dots'];
const golPresets = ["Conway's Rules", 'Seeds', 'HighLife'];
const fractalPresets = ['Spiral', 'Dendrite', 'Standard'];
const rxnDiffusionPresets = ['Coral', 'Spots', 'Waves'];
const fluidPresets = ['Default', 'Long Trails', 'Pressure View'];

function switchExample(id: ExampleID): void {
	activeExample.value = id;
}

const pendingPreset = ref<string | null>(null);
provide('gpuio-pendingPreset', pendingPreset);

function presetItem(id: ExampleID, name: string): { label: string; action: () => void } {
	return {
		label: name,
		action: (): void => {
			if (get(activeExample) === id) {
				get(actions).applyPreset?.(name);
			} else {
				pendingPreset.value = name;
				switchExample(id);
			}
		}
	};
}

const menus: OSGUITopLevelMenus = {
	'&View': [
		{
			label: 'Show &Controls',
			checkbox: {
				check: () => get(showControls),
				toggle: () => {
					showControls.value = !get(showControls);
				}
			}
		},
		MENU_DIVIDER,
		{
			label: '&Physarum',
			submenu: physarumPresets.map((name) => presetItem('physarum', name))
		},
		{
			label: '&Game of Life',
			submenu: golPresets.map((name) => presetItem('gol', name))
		},
		{
			label: '&Fractal',
			submenu: fractalPresets.map((name) => presetItem('fractal', name))
		},
		{
			label: 'Reaction &Diffusion',
			submenu: rxnDiffusionPresets.map((name) => presetItem('reactiondiffusion', name))
		},
		{
			label: '&Fluid',
			submenu: fluidPresets.map((name) => presetItem('fluid', name))
		}
	]
};
</script>

<template>
	<GpuWindow app-i-d="gpuio">
		<template #menubar><MenuBar :menus="menus" /></template>
		<component :is="currentComponent" :key="activeExample" />
	</GpuWindow>
</template>
