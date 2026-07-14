<script setup lang="ts">
import IFrameWindow from '@compunents/IFrameWindow.vue';
import { ref } from 'vue';
import { MENU_DIVIDER, MenuBar } from '@os-gui';
import { get, useEventBus, useFileDialog, useObjectUrl } from '@vueuse/core';
import { pvzBridge, pvzBridgeKey } from '@assets/games/plants-vs-zombies/bridge.ts';

const bus = useEventBus(pvzBridgeKey);
window.$pvzBus = bus;

const urls = {
	js: new URL('/plants-vs-zombies/plants-vs-zombies.js', location.href).href,
	data: new URL('/plants-vs-zombies/plants-vs-zombies.data', location.href).href,
	wasm: new URL('/plants-vs-zombies/plants-vs-zombies.wasm', location.href).href
};

const html = `<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<style>
			* { margin: 0; padding: 0; box-sizing: border-box }
			html, body { width: 100%; height: 100%; background: #000; overflow: hidden }
			canvas { display: block; width: 100%; height: 100%; outline: 0; object-fit: contain }
		</style>
	</head>
	<body>
		<canvas id="canvas" tabindex="-1"></canvas>
		<script>window.PVZ_URLS=${JSON.stringify(urls)};(${pvzBridge})();<${'/script'}>
	</body>
</html>`;

const src = useObjectUrl(new Blob([html], { type: 'text/html' }));

const SPEEDS = [0.5, 1, 2, 5, 10, 20];
const speed = ref(1);

function setSpeed(value: number): void {
	speed.value = value;
	bus.emit({ type: 'pvz:speed', value });
}

function setMuted(muted: boolean): void {
	bus.emit({ type: 'pvz:muted', value: muted });
}

const { open: openPicker, onChange: onPickerChange } = useFileDialog({
	accept: '.bin,.dat,application/octet-stream',
	multiple: true,
	reset: true
});

onPickerChange((files) => {
	if (files?.length) {
		bus.emit({ type: 'pvz:import', files: [...files] });
	}
});

bus.on((msg: PvzBridgeMessage) => {
	switch (msg.type) {
		case 'pvz:ready': {
			bus.emit({ type: 'pvz:speed', value: get(speed) });
			break;
		}
		case 'pvz:export-result': {
			const url = URL.createObjectURL(msg.blob);
			Object.assign(document.createElement('a'), { href: url, download: msg.filename }).click();
			setTimeout(() => URL.revokeObjectURL(url), 10_000);
			break;
		}
		case 'pvz:imported': {
			if (msg.count > 0 && confirm(`imported ${msg.count} file(s). reload to apply?`)) {
				location.reload();
			} else if (msg.count === 0) {
				alert('no importable files were found (needs .bin or .dat)');
			}
			break;
		}
		case 'pvz:error': {
			alert(msg.message);
			break;
		}
		default: {
			break;
		}
	}
});

const menus: OSGUITopLevelMenus = {
	'&File': [
		{ label: '&Save', action: (): void => bus.emit({ type: 'pvz:save' }) },
		{ label: '&Export saves', action: (): void => bus.emit({ type: 'pvz:export' }) },
		{ label: '&Import saves', action: (): void => openPicker() },
		MENU_DIVIDER,
		{
			label: '&Delete save data',
			action: (): void => {
				if (confirm('delete all save data?')) {
					bus.emit({ type: 'pvz:clean' });
				}
			}
		}
	],
	'&Speed': [
		{
			ariaLabel: 'Game speed',
			radioItems: SPEEDS.map((v) => ({ label: `${v}x`, value: v })),
			getValue: () => get(speed),
			setValue: setSpeed
		}
	]
};
</script>

<template>
	<IFrameWindow
		app-i-d="plantsvszombies"
		ready-message="pvz:ready"
		:iframe-options="{ src }"
		@open="setMuted(false)"
		@close="setMuted(true)">
		<template #menubar>
			<MenuBar :menus="menus" />
		</template>
	</IFrameWindow>
</template>
