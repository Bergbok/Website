<script setup lang="ts">
import yugiohSWF from '@assets/games/flash/yugioh.swf?url';
import RuffleWindow from '@components/computer/RuffleWindow.vue';
import { MenuBar } from '@os-gui';

const menus: OSGUITopLevelMenus = {
	'&View': [
		{
			label: '&My Cards',
			action: (): void => {
				window.open('https://buymycardspls.bergbok.party');
			}
		}
	]
};
</script>

<template>
	<RuffleWindow ref="frameWindow" app-i-d="yugioh" :swf-url="yugiohSWF" :ruffle-config="{ autoplay: 'on' }">
		<template #menubar>
			<MenuBar :menus="menus" />
		</template>
	</RuffleWindow>
</template>
