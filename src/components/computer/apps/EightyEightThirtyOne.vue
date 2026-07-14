<script setup lang="ts">
import 'nprogress/nprogress.css';
import Color from 'color';
import NProgress from 'nprogress';
import AppWindow from '@compunents/AppWindow.vue';
import loading88x31 from '@assets/images/88x31/))).avif';
import button88x31 from '@assets/images/88x31/eightyeightthirtyone.avif';
import { useAppOpen } from '@composables/useApp.ts';
import { get, useEventListener } from '@vueuse/core';
import { useSettingsStore } from '@store/settings.ts';
import { useNProgress } from '@vueuse/integrations/useNProgress';
import { Cosmograph, prepareCosmographData } from '@cosmograph/cosmograph';
import { computed, nextTick, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';

interface ScrapedGraph {
	linksTo: Record<string, string[]>;
	linkedFrom: Record<string, string[]>;
	images: Record<string, string[]>;
}

const { isOpen, appOpenListeners } = useAppOpen();

const containerRef = useTemplateRef<HTMLDivElement>('graphContainer');
const origGraph = shallowRef<ScrapedGraph | null>(null);

const searchValue = ref('');
const graphReady = ref(false);
const selected = ref<string | null>(null);
const { isLoading, progress } = useNProgress(null, { showSpinner: false });
const showOverlay = ref(true);
const settingsStore = useSettingsStore();
const accentColors = computed(() => {
	const base = new Color(settingsStore.accentColor);
	return {
		self: base.hex(),
		both: base.rotate(180).hex(),
		linksTo: base.rotate(90).hex(),
		linkedFrom: base.rotate(-90).hex()
	};
});

let cosmograph: Cosmograph | null = null;
let isReady = false;
let preparedData: NonNullable<Awaited<ReturnType<typeof prepareCosmographData>>> | null = null;
const idToIndex = new Map<string, number>();
const indexToID: string[] = [];

const allNodeIDs = computed<string[]>(() => {
	const g = get(origGraph);
	if (!g) {
		return [];
	}
	return [...new Set([...Object.keys(g.linksTo), ...Object.keys(g.linkedFrom), ...Object.keys(g.images)])].filter(
		(x) => x !== ''
	);
});

const selectedRel = computed(() => {
	const g = get(origGraph);
	const s = get(selected);
	if (!g || !s) {
		return { linksTo: [] as string[], linkedFrom: [] as string[], images: [] as string[] };
	}
	return { linksTo: g.linksTo[s] ?? [], linkedFrom: g.linkedFrom[s] ?? [], images: g.images[s] ?? [] };
});

async function fetchJsonWithProgress<T>(url: string, onProgress: (ratio: number) => void): Promise<T> {
	const response = await fetch(url);
	const total = Number.parseInt(response.headers.get('Content-Length') ?? '0', 10);
	const chunks: Uint8Array[] = [];
	let received = 0;
	await response.body!.pipeTo(
		new WritableStream<Uint8Array>({
			write(chunk): void {
				chunks.push(chunk);
				received += chunk.byteLength;
				if (total > 0) {
					onProgress(received / total);
				}
			}
		})
	);
	return JSON.parse(await new Blob(chunks as BlobPart[]).text()) as T;
}

function buildConfig(pointSize: number): Parameters<Cosmograph['setConfig']>[0] {
	const data = preparedData!;
	return {
		...data.cosmographConfig,
		points: data.points,
		links: data.links,
		backgroundColor: '#000',
		pointGreyoutOpacity: 0.25,
		linkGreyoutOpacity: 0.25,
		linkArrowsSizeScale: 2,
		selectPointOnClick: false,
		resetSelectionOnEmptyCanvasClick: false,
		disableLogging: true,
		onClick: (index): void => {
			const id = typeof index === 'number' ? indexToID[index] : null;
			select(id ?? null);
		},
		pointLabelBy: 'id',
		showHoveredPointLabel: true,
		showDynamicLabels: false,
		showTopLabels: false,
		pointColorBy: 'id',
		pointColorByFn: computeNodeColor,
		pointSizeBy: 'id',
		pointSizeByFn: (): number => pointSize
	};
}

async function initCosmograph(container: HTMLElement): Promise<void> {
	try {
		const raw = await fetchJsonWithProgress<ScrapedGraph>('/eightyeightthirtyone/graph.json', (ratio) => {
			progress.value = ratio * 0.6;
		});
		origGraph.value = raw;

		const domains = get(allNodeIDs);
		const rawNodes = domains.map((id) => ({ id }));
		const rawLinks: { source: string; target: string }[] = [
			...Object.entries(raw.linksTo).flatMap(([d, targets]) =>
				targets.filter((t) => d && t).map((t) => ({ source: d, target: t }))
			),
			...Object.entries(raw.linkedFrom).flatMap(([d, targets]) =>
				targets.filter((t) => d && t).map((t) => ({ source: t, target: d }))
			)
		];

		progress.value = 0.7;
		const result = await prepareCosmographData(
			{
				points: { pointIdBy: 'id' },
				links: { linkSourceBy: 'source', linkTargetsBy: ['target'] }
			},
			rawNodes,
			rawLinks
		);
		if (!result) {
			isLoading.value = false;
			return;
		}

		preparedData = result;
		progress.value = 0.8;
		cosmograph = new Cosmograph(container, { disableLogging: true });
		showOverlay.value = false;

		await cosmograph.setConfig(buildConfig(4));

		isReady = true;
		progress.value = 0.9;
		isLoading.value = false;

		const indices = await cosmograph.getPointIndicesByIds(domains);
		if (indices) {
			for (let i = 0; i < domains.length; i++) {
				const idx = indices[i];
				const domainID = domains[i];
				if (typeof idx === 'number' && typeof domainID === 'string') {
					idToIndex.set(domainID, idx);
					indexToID[idx] = domainID;
				}
			}
		}

		graphReady.value = true;
	} catch (error) {
		console.error('init error', error);
		isLoading.value = false;
	}
}

async function select(domain: string | null, doPan = false): Promise<void> {
	if (domain && domain.length > 4) {
		selected.value = domain;
		if (cosmograph && get(origGraph)) {
			const rel = new Set([
				domain,
				...(get(origGraph)!.linksTo[domain] ?? []),
				...(get(origGraph)!.linkedFrom[domain] ?? [])
			]);
			cosmograph.selectPoints(
				[...rel].map((id) => idToIndex.get(id)).filter((idx): idx is number => typeof idx === 'number')
			);
		}
		if (doPan) {
			pan(domain);
		}
	} else {
		selected.value = null;
		cosmograph?.unselectAllPoints();
	}
	if (cosmograph && isReady && preparedData) {
		await cosmograph.setConfig(buildConfig(6));
	}
}

function computeNodeColor(id: string): string {
	const sel = get(selected);
	if (sel === null || get(origGraph) === null) {
		return pastel(id);
	}
	if (id === sel) {
		return get(accentColors).self;
	}
	const toSel = (get(origGraph)!.linksTo[id] ?? []).includes(sel);
	const fromSel = (get(origGraph)!.linkedFrom[id] ?? []).includes(sel);
	if (toSel && fromSel) {
		return get(accentColors).both;
	}
	if (toSel) {
		return get(accentColors).linksTo;
	}
	if (fromSel) {
		return get(accentColors).linkedFrom;
	}
	return '#fff';
}

function pan(domain: string): void {
	const idx = idToIndex.get(domain);
	if (cosmograph && typeof idx === 'number') {
		cosmograph.zoomToPoint(idx);
	}
}

function pastel(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (str.charCodeAt(i) + hash * 31) % 3600;
	}
	return `hsl(${Math.abs(hash) % 360}, 50%, 80%)`;
}

function resetView(): void {
	cosmograph?.fitView();
}

watch(isOpen, async (opened): Promise<void> => {
	if (!opened || cosmograph) {
		return;
	}
	await nextTick();
	const container = get(containerRef);
	if (!container) {
		return;
	}
	NProgress.configure({ parent: '#app-88x31' });
	isLoading.value = true;
	await initCosmograph(container);
});

useEventListener(document, 'keydown', (e: KeyboardEvent): void => {
	if (!get(isOpen) || !get(selected) || !cosmograph) {
		return;
	}
	if (e.key === ' ') {
		e.preventDefault();
		pan(get(selected)!);
	}
});

onUnmounted(() => {
	cosmograph?.destroy();
});
</script>

<template>
	<AppWindow app-i-d="eightyeightthirtyone" v-on="appOpenListeners">
		<div class="app-root" id="app-88x31">
			<div ref="graphContainer" class="graph-canvas" />
			<Transition name="fade">
				<div v-if="showOverlay" class="overlay">
					<img :src="loading88x31" alt="" class="loading-image" />
				</div>
			</Transition>
			<template v-if="graphReady">
				<div v-if="selected" class="infobox">
					<div class="infobox-inner">
						<a :href="`https://${selected}`" target="_blank">
							<h3>{{ selected }}</h3>
						</a>

						<template v-if="selectedRel.linksTo.length">
							<span>links to:</span>
							<ul>
								<li v-for="x in selectedRel.linksTo" :key="x">
									<button @click="select(x, true)">{{ x }}</button>
								</li>
							</ul>
						</template>

						<template v-if="selectedRel.linkedFrom.length">
							<span>linked from:</span>
							<ul>
								<li v-for="x in selectedRel.linkedFrom" :key="x">
									<button @click="select(x, true)">{{ x }}</button>
								</li>
							</ul>
						</template>

						<span>badges:</span>
						<ul class="badges-list">
							<li v-for="x in selectedRel.images" :key="x" class="badge-item">
								<img :src="`/eightyeightthirtyone/badge/${x}`" :alt="x" loading="lazy" />
							</li>
						</ul>
					</div>
				</div>

				<div class="controls-panel">
					<datalist id="88x31-domains">
						<option v-for="id in allNodeIDs" :key="id" :value="id" />
					</datalist>

					<form class="search-row" @submit.prevent="select(searchValue, true)">
						<input v-model="searchValue" type="text" list="88x31-domains" placeholder="enter domain name" />
						<button type="submit">search</button>
					</form>

					<button @click="resetView()">reset view</button>
					<div class="panel-row">
						<a href="https://github.com/NotNite/eightyeightthirtyone" target="_blank" class="badge-link">
							<img :src="button88x31" alt="eightyeightthirty.one" class="badge-88x31" />
						</a>
					</div>
				</div>
			</template>
		</div>
	</AppWindow>
</template>

<style scoped>
:deep(div[class^='style_module_attribution']) {
	display: none;
}

.app-host {
	display: contents;
}

.app-root {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: #000;
	color: #ebebeb;
	font-size: 14px;

	& .graph-canvas {
		position: absolute;
		inset: 0;
	}

	& .overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 2rem;
		z-index: 10;

		p {
			max-width: 360px;
		}

		& .loading-image {
			width: 88px;
			height: 31px;
		}
	}

	& .infobox {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 280px;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(10px);
		border-right: 2px solid #2a2a2a;
		z-index: 5;
		box-sizing: border-box;

		& .infobox-inner {
			height: 100%;
			overflow-y: auto;
			padding-right: 0.5rem;

			h3 {
				margin: 0 0 0.5rem;
			}

			ul {
				padding-left: 0;
				list-style: none;
				margin: 0.3rem 0;
			}

			li {
				display: flex;
				align-items: center;
				margin: 0.15rem 0;
			}

			li::before {
				content: '';
				min-width: 4px;
				min-height: 4px;
				border-radius: 50%;
				background: currentColor;
				margin-right: 0.5rem;
				flex-shrink: 0;
			}

			& .badges-list {
				display: flex;
				flex-wrap: wrap;
				gap: 0.2rem;

				& .badge-item {
					display: inline-flex;

					&::before {
						display: none;
					}

					img {
						width: 88px;
						height: 31px;
						image-rendering: pixelated;
					}
				}
			}
		}
	}

	& .controls-panel {
		position: absolute;
		bottom: 0;
		right: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(10px);
		padding: 0.5rem;
		max-width: 220px;
		border-radius: 0.5rem 0 0 0;
		border-width: 2px 0 0 2px;
		border-style: solid;
		border-color: #2a2a2a;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		z-index: 5;

		& .search-row {
			display: flex;
			flex-direction: column;
			gap: 0.3rem;
			margin: 0;
		}

		& .panel-row {
			display: flex;
			justify-content: center;

			& .badge-link {
				display: inline-block;
				line-height: 0;

				& .badge-88x31 {
					display: block;
					width: 88px;
					height: 31px;
					image-rendering: pixelated;
				}
			}
		}
	}
}

a {
	color: inherit;
}

button,
input[type='text'] {
	background: #2a2a2a;
	border-radius: 2px;
	border: 1.5px solid #484848;
	box-sizing: border-box;
	color: inherit;
	cursor: pointer;
	font-size: 0.85em;
	overflow: hidden;
	padding: 0.2rem 0.4rem;
	text-overflow: ellipsis;
	width: 100%;
}

button:hover {
	background: #383838;
}

input[type='text']:focus-visible,
button:focus-visible {
	outline: 1px solid #888;
	outline-offset: 0;
}

.fade-leave-active {
	transition: opacity 0.2s ease;
}

.fade-leave-to {
	opacity: 0;
}
</style>
