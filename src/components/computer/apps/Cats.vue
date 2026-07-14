<script setup lang="ts">
import Icon from '@compunents/Icon.vue';
import icon from '@assets/images/cat.avif';
import over9000 from '@assets/audio/over-9000.opus';
import { Howl } from 'howler';
import { Window } from '@os-gui';
import { ref, watch } from 'vue';
import { useDesktopContext } from '@composables/useDesktop.ts';
import { get, TransitionPresets, useImage, useTransition } from '@vueuse/core';

interface CatImage {
	src: string;
	width: number;
	height: number;
}

interface CatWindow {
	id: number;
	x: number;
	y: number;
	image: CatImage;
}

const MAX_IMG_WIDTH = 420;
const started = ref(false);
const spawnedCount = ref(0);
const progressSource = ref(0);
const windows = ref<CatWindow[]>([]);
const { usableRect } = useDesktopContext();
let imagePool: CatImage[] = [];
let nextID = 0;

const cats = Object.values(
	import.meta.glob<string>('@assets/images/cats/*', {
		eager: true,
		import: 'default',
		query: '?no-inline'
	})
);

const catLoaders = cats.map((src) => ({
	src,
	loader: useImage({ src }, { immediate: false })
}));

const progress = useTransition(progressSource, {
	duration: 42_000,
	transition: TransitionPresets.easeInQuint,
	onFinished: () => {
		new Howl({ src: [over9000], volume: 0.9 }).play();
	}
});

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j]!, a[i]!];
	}
	return a;
}

function cat(): void {
	if (imagePool.length === 0) {
		return;
	}
	const image = imagePool[nextID % imagePool.length]!;
	const maxX = Math.max(0, get(usableRect).width - image.width);
	const maxY = Math.max(0, get(usableRect).height - 200);
	get(windows).push({
		id: nextID++,
		x: Math.floor(Math.random() * maxX),
		y: Math.floor(Math.random() * maxY),
		image
	});
}

function redact(id: number): void {
	windows.value = get(windows).filter((w) => w.id !== id);
}

async function catAttack(): Promise<void> {
	if (!get(started)) {
		started.value = true;

		document.body.classList.add('cat');

		await Promise.all(catLoaders.map(({ loader }) => loader.execute()));
		imagePool = shuffle(catLoaders).map(({ src, loader }) => {
			const img = get(loader.state);
			const naturalWidth = img?.naturalWidth || MAX_IMG_WIDTH;
			const naturalHeight = img?.naturalHeight || MAX_IMG_WIDTH;
			const scale = Math.min(1, MAX_IMG_WIDTH / naturalWidth);
			return {
				src,
				width: Math.round(naturalWidth * scale),
				height: Math.round(naturalHeight * scale)
			};
		});
		progressSource.value = 1;
	}
}

watch(progress, (val) => {
	const target = Math.min(Math.floor(val * 9001), 9001);
	while (get(spawnedCount) < target) {
		cat();
		spawnedCount.value++;
	}
});
</script>

<template>
	<Icon id="cats" label="cats" :icon @open="catAttack" />

	<Teleport defer to="#screen">
		<Window
			v-for="win in windows"
			app-i-d="cats"
			:height="win.image.height"
			:initial-x="win.x"
			:initial-y="win.y"
			:key="win.id"
			:label="String(win.id + 1)"
			:maximize-button="false"
			:minimize-button="false"
			:persist-geometry="false"
			:width="win.image.width"
			@close="redact(win.id)">
			<img class="image" :src="win.image.src" :width="win.image.width" :height="win.image.height" />
		</Window>
	</Teleport>
</template>

<style scoped>
.image {
	display: block;
}
</style>
