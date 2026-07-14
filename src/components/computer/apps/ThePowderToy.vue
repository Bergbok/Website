<script setup lang="ts">
import IFrameWindow from '@compunents/IFrameWindow.vue';
import { useObjectUrl } from '@vueuse/core';

const js = new URL('/thepowdertoy/powder.js', location.href).href;
const wasm = new URL('/thepowdertoy/powder.wasm', location.href).href;
const html = `<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<style>
			* { margin: 0; padding: 0 }
			canvas { display: none; width: 100%; height: 100% }
			html, body { width: 100%; height: 100%; background: #000; overflow: hidden }
		</style>
	</head>
	<body>
		<form id="PowderSessionInfo" style="display:none">
			<input type="hidden" name="Username" value="">
			<input type="hidden" name="SessionKey" value="">
		</form>
		<canvas id="canvas" tabindex="-1"></canvas>
		<script>
			document.getElementById('canvas').addEventListener('contextmenu', function(e) { e.preventDefault(); });

			window.addEventListener('message', function(e) {
				if (e.data === 'tpt:resize') window.dispatchEvent(new Event('resize'));
			});
			window.mark_presentable = function() {
				document.getElementById('canvas').style.display = 'initial';
				parent.postMessage('tpt:ready', '*');
			};

			var s = document.createElement('script');
			s.src = '${js}';
			s.onload = function() {
				create_powder({
				canvas: document.getElementById('canvas'),
				print: console.log,
				printErr: console.warn,
				locateFile: function(path) {
				return path.endsWith('.wasm') ? '${wasm}' : path;
				}});
			};
			document.head.appendChild(s);
		<${'/script'}>
	</body>
</html>`;

const src = useObjectUrl(new Blob([html], { type: 'text/html' }));
</script>

<template>
	<IFrameWindow
		app-i-d="thepowdertoy"
		ready-message="tpt:ready"
		resize-message="tpt:resize"
		:iframe-options="{ src }" />
</template>
