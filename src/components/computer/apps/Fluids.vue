<script setup lang="ts">
import IFrameWindow from '@compunents/IFrameWindow.vue';
import { ref } from 'vue';
import { MenuBar } from '@os-gui';

const src = ref('/fluidsimulation');

const menus: OSGUITopLevelMenus = {
	'&View': [
		{
			label: 'Fluid &Simulation',
			action: (): void => {
				src.value = '/fluidsimulation';
			}
		},
		{
			label: 'Fluid &Experiment',
			action: (): void => {
				src.value = 'https://bergbok.computer/fluidexperiment';
			}
		},
		{
			label: '&Bath Bomb',
			action: (): void => {
				src.value = '/bathbomb';
			}
		}
	]
};
</script>

<template>
	<IFrameWindow ref="frameWindow" app-i-d="fluids" :iframe-options="{ src }">
		<template #menubar>
			<MenuBar :menus="menus" />
		</template>
	</IFrameWindow>
</template>
