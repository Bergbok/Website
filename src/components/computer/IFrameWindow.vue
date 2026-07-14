<script setup lang="ts">
import AppWindow from '@compunents/AppWindow.vue';
import { ref, useTemplateRef } from 'vue';
import { get, useEventListener, useResizeObserver } from '@vueuse/core';
import type { Neon } from 'shaders/vue';
import type { AppID } from '@components/computer/apps';
import type { IframeHTMLAttributes as IFrameAttributes } from 'vue';

const { appID, readyMessage, resizeMessage, shaderOptions, iframeOptions, disableLoadingOverlay } = defineProps<{
	appID: AppID;
	/** message the iframe posts when ready. Falls back to the @load event when omitted. */
	readyMessage?: string;
	/** message to post to the iframe when it is resized. */
	resizeMessage?: string;
	shaderOptions?: InstanceType<typeof Neon>['$props'];
	iframeOptions: IFrameAttributes;
	/** hide the default "loading..." overlay */
	disableLoadingOverlay?: boolean;
}>();

const emit = defineEmits<{ open: []; close: [] }>();

defineSlots<{ menubar?: () => unknown }>();

const iframeRef = useTemplateRef<HTMLIFrameElement>('iframe');

useResizeObserver(iframeRef, () => {
	if (resizeMessage) {
		get(iframeRef)?.contentWindow?.postMessage(resizeMessage, '*');
	}
});

const isLoading = ref(true);

if (readyMessage) {
	useEventListener(window, 'message', (e: MessageEvent) => {
		if (e.data === readyMessage) {
			isLoading.value = false;
		}
	});
}

function onLoad(): void {
	if (!readyMessage) {
		isLoading.value = false;
	}
}

defineExpose({ iframeEl: iframeRef });
</script>

<template>
	<AppWindow :app-i-d="appID" :shader-options="shaderOptions" @open="emit('open')" @close="emit('close')">
		<template v-if="$slots.menubar" #menubar><slot name="menubar" /></template>
		<div class="frame">
			<div v-show="isLoading && !disableLoadingOverlay" class="loading">loading...</div>
			<iframe ref="iframe" class="content" v-bind="iframeOptions" @load="onLoad" />
		</div>
	</AppWindow>
</template>

<style scoped>
.frame {
	background: #000;
	height: 100%;
	overflow: hidden;
	position: relative;
	width: 100%;

	&:has(iframe[src='/openrct2']) {
		background: unset;
	}

	& .loading {
		align-items: center;
		background: #000;
		color: #ccc;
		display: flex;
		font-size: 13px;
		inset: 0;
		justify-content: center;
		position: absolute;
		z-index: 1;
	}

	& .content {
		border: none;
		display: block;
		height: 100%;
		width: 100%;
	}
}
</style>
