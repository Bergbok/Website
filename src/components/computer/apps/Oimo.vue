<script setup lang="ts">
import lifeThumb from '@lib/oimo/imgs/life.png';
import AppWindow from '@compunents/AppWindow.vue';
import chillThumb from '@lib/oimo/imgs/chill.png';
import clockThumb from '@lib/oimo/imgs/clock.png';
import dropsThumb from '@lib/oimo/imgs/drops.png';
import jellyThumb from '@lib/oimo/imgs/jelly.png';
import waterThumb from '@lib/oimo/imgs/water.png';
import marimoThumb from '@lib/oimo/imgs/marimo.png';
import bubblesThumb from '@lib/oimo/imgs/bubbles.png';
import { ref } from 'vue';
import { MENU_DIVIDER, MenuBar } from '@os-gui';

interface Work {
	id: string;
	title: string;
	thumb: string;
}

const works: Work[] = [
	{ id: 'bubbles', title: 'Bubbles', thumb: bubblesThumb },
	{ id: 'chill', title: 'Chill', thumb: chillThumb },
	{ id: 'clock', title: 'Clock', thumb: clockThumb },
	{ id: 'drops', title: 'Drops', thumb: dropsThumb },
	{ id: 'jelly', title: 'Jelly', thumb: jellyThumb },
	{ id: 'life', title: 'Life Universe', thumb: lifeThumb },
	{ id: 'marimo', title: 'Marimo', thumb: marimoThumb },
	{ id: 'water', title: 'Water', thumb: waterThumb }
];

const selected = ref<Work | null>(null);

function selectWork(work: Work | null): void {
	selected.value = work;
}

const menus: OSGUITopLevelMenus = {
	'&View': [
		{
			label: '&Picker',
			action: (): void => {
				selectWork(null);
			}
		},
		MENU_DIVIDER,
		...works.map((work) => ({
			label: work.title,
			action: (): void => {
				selectWork(work);
			}
		}))
	]
};
</script>

<template>
	<AppWindow app-i-d="oimo">
		<template #menubar>
			<MenuBar :menus="menus" />
		</template>
		<div class="body">
			<div v-show="selected === null" class="picker">
				<button v-for="work in works" :key="work.id" type="button" class="tile" @click="selectWork(work)">
					<img :src="work.thumb" :alt="work.title" loading="lazy" />
					<span>{{ work.title }}</span>
				</button>
			</div>
			<iframe
				v-show="selected !== null"
				ref="iframe"
				class="frame"
				:src="selected?.id ? `/oimo/${selected.id}` : 'about:blank'"
				sandbox="allow-scripts allow-same-origin allow-popups allow-modals" />
		</div>
	</AppWindow>
</template>

<style scoped>
.body {
	width: 100%;
	height: 100%;
	background: #191919;
	position: relative;

	& .picker {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 12px;
		padding: 16px;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		overflow-y: auto;
		align-content: start;

		& .tile {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 6px;
			padding: 8px;
			background: #222;
			color: #fff;
			border: 1px solid #444;
			cursor: pointer;
			font-size: 12px;

			&:hover {
				background: #333;
				border-color: #888;
			}

			& img {
				width: 100%;
				height: auto;
				display: block;
				object-fit: cover;
				aspect-ratio: 1 / 1;
			}
		}
	}

	& .frame {
		width: 100%;
		height: 100%;
		border: 0;
		display: block;
	}
}
</style>
