<script setup lang="ts">
import IFrameWindow from '@compunents/IFrameWindow.vue';
import { ref } from 'vue';
import { MenuBar } from '@os-gui';

const src = ref('/realm');

const menus: OSGUITopLevelMenus = {
	'&View': [
		{
			label: '&Realm',
			action: (): void => {
				src.value = '/realm';
			}
		},
		{
			label: '&Life',
			action: (): void => {
				src.value = '/life';
			}
		}
	]
};
</script>

<template>
	<IFrameWindow ref="frameWindow" app-i-d="realm" :iframe-options="{ src }">
		<template #menubar>
			<MenuBar :menus="menus" />
		</template>
	</IFrameWindow>
</template>
