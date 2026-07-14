<script setup lang="ts">
import Icon from '@compunents/Icon.vue';
import { computed, ref, watch } from 'vue';
import { useDesktopStore } from '@store/desktop.ts';
import { get, onKeyStroke, useWebSocket } from '@vueuse/core';

const desktopStore = useDesktopStore();
const selected = computed(() => desktopStore.selectedIcons.has('tally'));

const count = ref<number | null>(null);

const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/tally`;
const { data, send, status } = useWebSocket(wsUrl, {
	autoReconnect: { delay: 2000, retries: () => true }
});

watch(data, (raw) => {
	if (typeof raw !== 'string') {
		return;
	}
	try {
		const msg = JSON.parse(raw) as { type?: string; value?: number };
		if (msg.type === 'count' && typeof msg.value === 'number') {
			count.value = msg.value;
		}
	} catch {
		/*_*/
	}
});

function increment(): void {
	if (get(status) === 'OPEN') {
		send(JSON.stringify({ type: 'increment' }));
	} else {
		count.value = (get(count) ?? 0) + 1;
	}
}

onKeyStroke(['Enter', ' '], (e) => {
	if (!get(selected)) {
		return;
	}
	e.preventDefault();
	increment();
});

const display = computed(() => (get(count) === null ? '-' : get(count)!.toLocaleString()));

const iconSVG = computed(() => {
	const text = get(display);
	const fontSize = Math.max(8, Math.min(48, 96 / Math.max(text.length, 1)));
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text x="32" y="32" fill="#fff" font-family="Departure Mono" font-weight="bold" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central">${text}</text></svg>`;
	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
});
</script>

<template>
	<Icon id="tally" :label="display" :icon="iconSVG" keep-selection @open="increment" />
</template>
