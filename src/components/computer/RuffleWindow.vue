<script setup lang="ts">
import AppWindow from '@compunents/AppWindow.vue';
import { get } from '@vueuse/core';
import { useScript } from '@unhead/vue';
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import type { Neon } from 'shaders/vue';
import type { AppID } from '@components/computer/apps';
import type { RuffleConfig, RufflePlayerElement } from '@typings/ruffle.d.ts';

const { appID, swfUrl, ruffleConfig, shaderOptions } = defineProps<{
	appID: AppID;
	swfUrl: string;
	ruffleConfig?: RuffleConfig;
	shaderOptions?: InstanceType<typeof Neon>['$props'];
}>();

defineSlots<{ menubar?: () => unknown }>();

const { onLoaded } = useScript('/ruffle/ruffle.js');
const scriptLoaded = ref(false);
onLoaded(() => {
	scriptLoaded.value = true;
});

const appWindowRef = useTemplateRef<InstanceType<typeof AppWindow>>('appWindow');
const containerEl = useTemplateRef<HTMLElement>('containerEl');
const isLoading = ref(true);
const loadError = ref<string | null>(null);

const isOpen = computed(() => get(appWindowRef)?.isOpen ?? false);

let player: RufflePlayerElement | null = null;

watch(
	[isOpen, scriptLoaded],
	async ([nowOpen, loaded]) => {
		if (nowOpen && loaded && !player) {
			isLoading.value = true;
			loadError.value = null;
			await nextTick();
			if (!get(containerEl)) {
				return;
			}

			try {
				const ruffle = window.RufflePlayer.newest();
				player = ruffle.createPlayer();
				get(containerEl)!.appendChild(player);

				await player.load({ url: swfUrl, ...ruffleConfig });
				isLoading.value = false;
			} catch (error) {
				loadError.value = error instanceof Error ? error.message : 'Failed to load Ruffle';
				isLoading.value = false;
			}
		} else if (!nowOpen && player) {
			if (get(containerEl)?.contains(player)) {
				get(containerEl)!.removeChild(player);
			}
			player = null;
			isLoading.value = true;
			loadError.value = null;
		}
	},
	{ immediate: true }
);

onBeforeUnmount(() => {
	if (player && get(containerEl)?.contains(player)) {
		get(containerEl)!.removeChild(player);
	}
	player = null;
});
</script>

<template>
	<AppWindow ref="appWindow" :app-i-d="appID" :shader-options="shaderOptions">
		<template v-if="$slots.menubar" #menubar><slot name="menubar" /></template>
		<div ref="containerEl" class="container">
			<div v-if="isLoading" class="status">
				<template v-if="loadError">
					<p class="error">{{ loadError }}</p>
				</template>
				<template v-else>
					<p>loading...</p>
				</template>
			</div>
		</div>
	</AppWindow>
</template>

<style scoped>
.container {
	align-items: center;
	background: #000;
	display: flex;
	height: 100%;
	justify-content: center;
	overflow: hidden;
	position: relative;
	width: 100%;

	& .status {
		color: #ccc;
		font-size: 13px;
		inset: 0;
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1;

		& .error {
			color: #f87171;
		}
	}
}
</style>
