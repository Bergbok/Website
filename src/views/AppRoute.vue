<script setup lang="ts">
import './scene.css';
import { computed, provide } from 'vue';
import { getApp } from '@components/computer/apps';
import { provideDesktopContext } from '@composables/useDesktop.ts';
import type { AppID } from '@components/computer/apps';

const { appID } = defineProps<{ appID: AppID }>();
const { screenEl } = provideDesktopContext();
void screenEl;

provide('app-routed', true);
provide('app-routed-id', appID);

const Component = computed(() => getApp(appID).component);
</script>

<template>
	<div class="scene scene-app">
		<section ref="screenEl" id="screen" class="screen-4-3">
			<component :is="Component" />
		</section>
	</div>
</template>

<style scoped>
.screen-4-3 {
	background: #000;
	--taskbar-h: 0px;

	& :deep(.window-titlebar) {
		display: none;
	}
}
</style>
