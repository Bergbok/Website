<script setup lang="ts">
import IFrameWindow from '@compunents/IFrameWindow.vue';
import scpBridge from '@assets/games/spacecadetpinball/bridge.ts';
import { useTemplateRef } from 'vue';
import { get, useObjectUrl } from '@vueuse/core';

const windowRef = useTemplateRef<InstanceType<typeof IFrameWindow>>('blobWindow');

const urls = {
	js: new URL('/spacecadetpinball/SpaceCadetPinball.js', location.href).href,
	data: new URL('/spacecadetpinball/SpaceCadetPinball.data', location.href).href,
	wasm: new URL('/spacecadetpinball/SpaceCadetPinball.wasm', location.href).href
};

const html = `<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<style>
			* { margin: 0; padding: 0; box-sizing: border-box }
			canvas { display: block; width: 100%; height: 100% }
			html, body { width: 100%; height: 100%; background: #000; overflow: hidden }
		</style>
	</head>
	<body>
	<canvas id="canvas" class="emscripten" oncontextmenu="event.preventDefault()" tabindex="-1"></canvas>
		<script>window.SCP_URLS=${JSON.stringify(urls)};(${scpBridge})();<${'/script'}>
	</body>
</html>`;

const src = useObjectUrl(new Blob([html], { type: 'text/html' }));

function setIFrameMuted(muted: boolean): void {
	get(windowRef)?.iframeEl?.contentWindow?.setMuted?.(muted);
}
</script>

<template>
	<IFrameWindow
		ref="blobWindow"
		app-i-d="pinball"
		ready-message="scp:ready"
		resize-message="scp:resize"
		:iframe-options="{ src }"
		@open="setIFrameMuted(false)"
		@close="setIFrameMuted(true)" />
</template>
