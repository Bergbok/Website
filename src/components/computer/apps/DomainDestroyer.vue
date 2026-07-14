<script setup lang="ts">
import 'domain-destroyer/dist/css/destroyer.css';
import Icon from '@compunents/Icon.vue';
import icon from '@assets/images/desktop-destroyer.avif';
import { Window } from '@os-gui';
import { Destroyer } from 'domain-destroyer';
import { get, useEventListener } from '@vueuse/core';
import { ref, useTemplateRef, watch } from 'vue';

const label = 'Desktop Destroyer';

const hostRef = useTemplateRef<HTMLDivElement>('destroyerHost');
let destroyer: InstanceType<typeof Destroyer> | null = null;

const isOpen = ref(false);
const showControls = ref(false);

function open(): void {
	isOpen.value = true;
	showControls.value = true;
}

function close(): void {
	destroyer?.selfDestruct();
	destroyer = null;
	isOpen.value = false;
}

watch(hostRef, (el) => {
	if (el) {
		destroyer = new Destroyer(el, { defaultVolume: 0.125, volumeChangeDelta: 0.025 });
		destroyer.inject();
	}
});

useEventListener(document, 'keydown', (e: KeyboardEvent) => {
	if (!get(isOpen)) {
		return;
	}

	if (e.key.toUpperCase() === 'K') {
		showControls.value = !get(showControls);
	}

	if (e.key === 'Escape') {
		close();
	}
});
</script>

<template>
	<Icon id="destroyer" :label :icon @open="open" />

	<Teleport v-if="isOpen" defer to="body">
		<div ref="destroyerHost" id="host" />
	</Teleport>

	<Teleport v-if="isOpen && showControls" defer to="#screen">
		<div id="controls">
			<Window
				app-i-d="destroyer"
				label="Controls"
				:close-button="false"
				:minimize-button="false"
				:maximize-button="false"
				:persist-geometry="false"
				:initial-x="20"
				:initial-y="20"
				:height="105"
				:width="175"
				@close="showControls = false">
				<table class="table">
					<tbody>
						<tr>
							<td><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></td>
							<td>select weapon</td>
						</tr>
						<tr>
							<td><kbd>-</kbd> / <kbd>=</kbd></td>
							<td>cycle weapons</td>
						</tr>
						<tr>
							<td><kbd>;</kbd> / <kbd>'</kbd></td>
							<td>change volume</td>
						</tr>
						<tr>
							<td><kbd>K</kbd></td>
							<td>toggle help</td>
						</tr>
						<tr>
							<td><kbd>C</kbd></td>
							<td>clear</td>
						</tr>
						<tr>
							<td><kbd>Esc</kbd></td>
							<td>exit</td>
						</tr>
					</tbody>
				</table>
			</Window>
		</div>
	</Teleport>
</template>

<style scoped>
#host {
	inset: 0;
	pointer-events: auto;
	position: fixed;
	z-index: 9999;
}

#controls {
	inset: 0;
	pointer-events: none;
	position: absolute;
	z-index: 10000;

	& .table {
		border-collapse: collapse;
		font-size: 11px;
		width: 100%;

		& td {
			line-height: 1.3;
			padding: 1px 4px;
			vertical-align: middle;

			&:first-child {
				text-align: end;
				white-space: nowrap;
				width: 1%;
			}
		}
	}
}

kbd {
	border: 1px solid var(--button-shadow, #808080);
	display: inline-block;
	font-size: 0.85em;
	padding: 0 2px;
}
</style>
