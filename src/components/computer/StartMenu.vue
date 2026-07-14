<script setup lang="ts">
import picmin from '@assets/images/picmin.avif';
import { Button } from '@os-gui';
import { useApp } from '@composables/useApp.ts';

const emit = defineEmits<{ close: [] }>();

const settingsApp = useApp('settings');

function openSettings(): void {
	settingsApp.open();
	emit('close');
}

function shutdown(): void {
	emit('close');
	window.close();
}
</script>

<template>
	<nav class="menu">
		<img :src="picmin" alt="picmin" />
		<div class="items">
			<Button class="item" @click="openSettings"> Settings </Button>
		</div>
		<hr class="divider" />
		<Button class="item shutdown" @click="shutdown"> Shut Down...</Button>
	</nav>
</template>

<style scoped>
.menu {
	display: flex;
	flex-direction: column;
	gap: 1px;
	min-width: 160px;
	padding: 2px;

	& .items {
		display: flex;
		flex-direction: column;
		gap: 1px;

		& .item {
			align-items: center;
			display: flex;
			font-size: clamp(10px, 1.2vw, 13px);
			gap: 6px;
			justify-content: flex-start;
			padding: 4px 8px;
			text-align: left;
			width: 100%;
		}
	}

	& .divider {
		border-top: 1px solid var(--ButtonShadow, #808080);
		border: none;
		margin: 2px 0;
	}

	& .shutdown {
		color: inherit;
	}
}
</style>
