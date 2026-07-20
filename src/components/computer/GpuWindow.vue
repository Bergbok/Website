<script setup lang="ts">
import AppWindow from '@compunents/AppWindow.vue';
import { GPUComposer } from 'gpu-io';
import { get, useRafFn, useResizeObserver } from '@vueuse/core';
import { computed, nextTick, onBeforeUnmount, provide, ref, shallowRef, useTemplateRef, watch } from 'vue';
import type { AppID } from '@components/computer/apps';
import type { Neon } from 'shaders/vue';

const { appID, shaderOptions } = defineProps<{
	appID: AppID;
	shaderOptions?: InstanceType<typeof Neon>['$props'];
}>();

defineSlots<{ menubar?: () => unknown; default?: () => unknown }>();

const appWindowRef = useTemplateRef<InstanceType<typeof AppWindow>>('appWindow');
const canvasEl = useTemplateRef<HTMLCanvasElement>('canvasEl');
const isLoading = ref(true);
const isOpen = computed(() => get(appWindowRef)?.isOpen ?? false);
const composer = shallowRef<GPUComposer | null>(null);

let loopFn: (() => void) | null = null;
let resizeFn: (() => void) | null = null;

function registerLoop(fn: () => void): void {
	loopFn = fn;
}
function unregisterLoop(): void {
	loopFn = null;
}
function onResize(fn: () => void): void {
	resizeFn = fn;
}

const { pause: pauseRaf, resume: resumeRaf } = useRafFn(
	() => {
		get(composer)?.tick();
		loopFn?.();
	},
	{ immediate: false }
);

watch(
	isOpen,
	async (nowOpen) => {
		if (nowOpen && !get(composer)) {
			isLoading.value = true;
			await nextTick();
			if (!get(canvasEl)) {
				return;
			}

			try {
				composer.value = new GPUComposer({ canvas: get(canvasEl)! });
				resumeRaf();
				isLoading.value = false;
			} catch (error) {
				console.error('failed to initialize GPUComposer', error);
				isLoading.value = false;
			}
		} else if (!nowOpen && get(composer)) {
			pauseRaf();
			loopFn = null;
			resizeFn = null;
			isLoading.value = true;
			await nextTick();
			get(composer)!.dispose();
			composer.value = null;
		}
	},
	{ immediate: true }
);

provide('gpuio-canvas', canvasEl);
provide('gpuio-composer', composer);
provide('gpuio-registerLoop', registerLoop);
provide('gpuio-unregisterLoop', unregisterLoop);
provide('gpuio-onResize', onResize);

useResizeObserver(canvasEl, (entries) => {
	const [entry] = entries;
	if (!entry) {
		return;
	}
	const { width, height } = entry.contentRect;
	if (width > 0 && height > 0 && get(composer)) {
		get(composer)!.resize([Math.floor(width), Math.floor(height)]);
		resizeFn?.();
	}
});

onBeforeUnmount(() => {
	pauseRaf();
});
</script>

<template>
	<AppWindow ref="appWindow" :app-i-d="appID" :shader-options="shaderOptions">
		<template v-if="$slots.menubar" #menubar><slot name="menubar" /></template>
		<div class="container">
			<canvas ref="canvasEl" class="canvas" />
			<div v-if="isLoading" class="status">
				<p>initializing gpu-io...</p>
			</div>
			<div v-if="!isLoading" class="overlay">
				<slot />
			</div>
		</div>
	</AppWindow>
</template>

<style scoped>
.container {
	width: 100%;
	height: 100%;
	position: relative;
	background: #000;
	overflow: hidden;

	& .canvas {
		width: 100%;
		height: 100%;
		display: block;
	}

	& .status {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #ccc;
		font-size: 13px;
		z-index: 1;
		pointer-events: none;
	}

	& .overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;
	}
}
</style>
