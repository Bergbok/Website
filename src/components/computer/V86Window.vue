<script setup lang="ts">
import initWasm from 'v86/build/v86.wasm?init';
import AppWindow from '@compunents/AppWindow.vue';
import seabiosUrl from '@assets/v86/bios/seabios.bin?url';
import vgabiosUrl from '@assets/v86/bios/vgabios.bin?url';
import { V86 } from 'v86';
import { get } from '@vueuse/core';
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import type { V86Options } from 'v86';
import type { Neon } from 'shaders/vue';
import type { AppID } from '@components/computer/apps';

const { appID, v86Options, loadingImage, lockPointer, shaderOptions } = defineProps<{
	appID: AppID;
	v86Options: Omit<V86Options, 'screen_container' | 'screen' | 'wasm_fn'>;
	loadingImage?: string;
	lockPointer?: boolean;
	shaderOptions?: InstanceType<typeof Neon>['$props'];
}>();

const appWindowRef = useTemplateRef<InstanceType<typeof AppWindow>>('appWindow');
const screenEl = useTemplateRef<HTMLElement>('screenEl');
const isLoading = ref(true);
let emulator: V86 | null = null;

const isOpen = computed(() => get(appWindowRef)?.isOpen ?? false);

function handleScreenClick(): void {
	if (lockPointer && emulator && !get(isLoading)) {
		emulator.lock_mouse();
	}
}

watch(
	isOpen,
	async (nowOpen) => {
		if (nowOpen) {
			isLoading.value = true;
			await nextTick();
			if (!get(screenEl)) {
				return;
			}
			emulator = new V86({
				autostart: true,
				bios: { url: seabiosUrl },
				vga_bios: { url: vgabiosUrl },
				memory_size: 64 * 1024 * 1024,
				vga_memory_size: 4 * 1024 * 1024,
				...v86Options,
				screen_container: get(screenEl),
				wasm_fn: async (imports: WebAssembly.Imports): Promise<WebAssembly.Exports> => {
					const instance = await initWasm(imports);
					return instance.exports;
				}
			});
			emulator.add_listener('emulator-started', () => {
				isLoading.value = false;
			});
		} else {
			emulator?.destroy();
			emulator = null;
			isLoading.value = true;
		}
	},
	{ immediate: true }
);

onBeforeUnmount(() => {
	emulator?.destroy();
	emulator = null;
});
</script>

<template>
	<AppWindow ref="appWindow" :app-i-d="appID" :shader-options="shaderOptions">
		<div ref="screenEl" class="screen" @click="handleScreenClick">
			<div class="text" />
			<canvas class="canvas" />
			<img v-if="loadingImage && isLoading" :src="loadingImage" class="loading" alt="" />
		</div>
	</AppWindow>
</template>

<style scoped>
.screen {
	align-items: center;
	background: #000;
	display: flex;
	height: 100%;
	justify-content: center;
	overflow: hidden;
	position: relative;
	width: 100%;

	& :deep(div) {
		font-size: 15px;
		line-height: normal;
		white-space: pre;
	}

	& :deep(canvas) {
		height: 100% !important;
		object-fit: contain;
		width: 100% !important;
	}

	& .loading {
		height: 100%;
		inset: 0;
		object-fit: contain;
		pointer-events: none;
		position: absolute;
		width: 100%;
	}
}
</style>
