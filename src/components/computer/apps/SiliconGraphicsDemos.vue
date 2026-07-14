<script setup lang="ts">
import IFrameWindow from '@compunents/IFrameWindow.vue';
import { ref } from 'vue';
import { MENU_DIVIDER, MenuBar } from '@os-gui';

const src = ref('/sgi-demos/buttonfly/web/buttonfly_full.html');

function selectDemo(demo: string): void {
	src.value = `/sgi-demos/${demo}/web/${demo}_full.html`;
}

const menus: OSGUITopLevelMenus = {
	'&View': [
		{ label: '&Buttonfly', action: (): void => selectDemo('buttonfly') },
		{ label: '&Ideas', action: (): void => selectDemo('ideas') },
		{ label: 'I&nsect', action: (): void => selectDemo('insect') },
		{ label: '&Jello', action: (): void => selectDemo('jello') },
		{ label: '&Logo', action: (): void => selectDemo('logo') },
		{ label: '&Twilight', action: (): void => selectDemo('twilight') },
		MENU_DIVIDER,
		{ label: '&Bounce', action: (): void => selectDemo('bounce') },
		{ label: 'Fli&ght', action: (): void => selectDemo('flight') },
		{ label: '&Newave', action: (): void => selectDemo('newave') },
		{ label: '&Arena', action: (): void => selectDemo('arena') }
	]
};
</script>

<template>
	<IFrameWindow ref="frameWindow" app-i-d="sgidemos" :iframe-options="{ src }">
		<template #menubar>
			<MenuBar :menus="menus" />
		</template>
	</IFrameWindow>
</template>
