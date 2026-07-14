<script setup lang="ts">
import '@xterm/xterm/css/xterm.css';
import AppWindow from '@compunents/AppWindow.vue';
import initramfsUrl from '@lib/linux/initramfs.cpio.gz?url';
import { get } from '@vueuse/core';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { nextTick, onUnmounted, ref } from 'vue';
import { createLinux } from '@composables/useLinux.ts';
import type { LinuxInstance } from '@composables/useLinux.ts';

const terminalEl = ref<HTMLDivElement>();

let term: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let linux: LinuxInstance | null = null;
let booting = false;

async function boot(): Promise<void> {
	if (booting) {
		return;
	}
	booting = true;

	await nextTick();
	if (!get(terminalEl)) {
		return;
	}

	fitAddon = new FitAddon();
	term = new Terminal({
		theme: { background: '#013425', foreground: '#FFC012' },
		fontSize: 14
	});
	term.loadAddon(fitAddon);
	term.open(get(terminalEl)!);
	fitAddon.fit();

	const log = (text: string): void => {
		term?.write(`\x1B[2m${text}\x1B[0m\r\n`);
	};
	const consoleWrite = (data: string): void => {
		term?.write(data);
	};

	if (!window.crossOriginIsolated) {
		log('Warning: Page is not cross-origin isolated. SharedArrayBuffer may not be available.');
	}

	try {
		log('Loading Linux WebAssembly...');

		const [vmlinuxResponse, initrdResponse] = await Promise.all([fetch('/r2/vmlinux.wasm'), fetch(initramfsUrl)]);

		const vmlinux = await WebAssembly.compileStreaming(vmlinuxResponse);
		if (!vmlinuxResponse.ok || !initrdResponse.ok) {
			throw new Error('Failed to fetch kernel or initramfs');
		}
		const initrd = await initrdResponse.arrayBuffer();

		const bootCmdline =
			'maxcpus=3 nohz_full=0,2-63 root=/dev/ram0 rootfstype=ramfs init=/init console=hvc console=ttyS0';

		linux = await createLinux(vmlinux, bootCmdline, initrd, log, consoleWrite);

		term.onData((data) => {
			linux?.keyInput(data);
		});

		log('Linux WebAssembly booted.');
	} catch (error) {
		const err = error as Error;
		log(`Linux WebAssembly failed: ${err.name}: ${err.message}`);
		console.error(error);
	}

	const observer = new ResizeObserver(() => {
		fitAddon?.fit();
	});
	observer.observe(get(terminalEl)!);
}

onUnmounted(() => {
	term?.dispose();
});
</script>

<template>
	<AppWindow app-i-d="linux" @open="boot">
		<div ref="terminalEl" id="terminal" />
	</AppWindow>
</template>

<style scoped>
#terminal {
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: #013425;
}
</style>
