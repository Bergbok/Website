<script setup lang="ts">
import AppWindow from '@compunents/AppWindow.vue';
import datasetsJSON from '@lib/namegen/datasets.json';
import markovJS from '@lib/namegen/src/bin/js/markov.js?url';
import { Button, Scrollbar } from '@os-gui';
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { get, onStartTyping, useDebounceFn, useFetch, useObjectUrl } from '@vueuse/core';
import type { Ref } from 'vue';
import type { GenerateOptions } from '@typings/namegen.d.ts';

const datasets: Record<string, string[]> = datasetsJSON;

const { data: js } = useFetch(markovJS, {
	afterFetch: async (ctx) => {
		ctx.data = await ctx.response.text();
		return ctx;
	}
});
const markovCode = js as Ref<string | null>;

const patchedBlob = computed(() => {
	if (!get(markovCode)) {
		return;
	}
	const patched = get(markovCode)!.replace(
		'Main.main();',
		'window.NameGenerator = markov_namegen_NameGenerator;Main.main();'
	);
	return new Blob([patched], { type: 'application/javascript' });
});
const blobUrl = useObjectUrl(patchedBlob);

const loaded = ref(false);
let loadPromise: Promise<void> | null = null;

function loadMarkov(): Promise<void> {
	if (loadPromise) {
		return loadPromise;
	}
	if (window.markovLoaded && window.NameGenerator) {
		return Promise.resolve();
	}
	loadPromise = new Promise<void>((resolve) => {
		const stop = watch(blobUrl, (url) => {
			if (!url) {
				return;
			}
			stop();
			const script = document.createElement('script');
			script.src = url;
			script.addEventListener('load', () => {
				window.markovLoaded = true;
				resolve();
			});
			script.addEventListener('error', () => {
				resolve();
			});
			document.head.appendChild(script);
		});
	});
	return loadPromise;
}

function generateNames(data: string[], count: number, opts: GenerateOptions = {}): string[] {
	const { order = 3, prior = 0.01, backoff = true, minLength = 4, maxLength = 14 } = opts;
	const gen = new window.NameGenerator(data, order, prior, backoff);
	const seen = new Set(data.map((w) => w.toLowerCase()));
	const names: string[] = [];
	const deadline = Date.now() + 5000;
	const stallLimit = Math.max(2000, count * 20);
	let stallCount = 0;

	while (names.length < count && Date.now() < deadline && stallCount < stallLimit) {
		const name = gen.generateName(minLength, maxLength, '', '', '', '', null);
		if (name && !seen.has(name)) {
			seen.add(name);
			names.push(name);
			stallCount = 0;
		} else {
			stallCount++;
		}
	}

	return names;
}

function fractionFor(value: number, min: number, max: number): number {
	return (Math.max(min, Math.min(max, value)) - min) / (max - min);
}

const datasetKeys = Object.keys(datasets);
const checkedPresets = ref<Set<string>>(new Set());
const presetWords = ref('');
const order = ref(3);
const prior = ref(0);
const backoff = ref(false);
const autoUpdate = ref(true);
const minLength = ref(5);
const maxLength = ref(11);
const count = ref(100);
const names = ref<string[]>([]);
const outputText = computed(() => get(names).join(' '));

function getPreset(key: string): string[] {
	return datasets[key] ?? [];
}

const activeWords = computed(() => {
	const words = get(presetWords)
		.split(/[\s,]+/)
		.map((w) => w.trim().toLowerCase())
		.filter(Boolean);
	return [...new Set(words)];
});

const wordCount = computed(() => get(activeWords).length);

function rebuildPresetWords(): void {
	const allWords: string[] = [];
	for (const key of get(checkedPresets)) {
		allWords.push(...getPreset(key));
	}
	presetWords.value = [...new Set(allWords)].join(' ');
}

function togglePreset(key: string): void {
	const set = get(checkedPresets);
	if (set.has(key)) {
		set.delete(key);
	} else {
		set.add(key);
	}
	checkedPresets.value = new Set(set);
	rebuildPresetWords();
}

function regenerate(): void {
	const words = get(activeWords);
	if (words.length === 0) {
		names.value = [];
		return;
	}

	const opts: GenerateOptions = {
		order: get(order),
		prior: get(prior),
		backoff: get(backoff),
		minLength: get(minLength),
		maxLength: get(maxLength)
	};

	names.value = generateNames(words, get(count), opts);
}

const debouncedRegen = useDebounceFn(regenerate, 300);

watch([presetWords, order, prior, backoff, minLength, maxLength, count], () => {
	if (get(loaded) && get(autoUpdate)) {
		debouncedRegen();
	}
});

const wordsTextarea = useTemplateRef<HTMLTextAreaElement>('wordsTextarea');

onStartTyping(() => {
	get(wordsTextarea)?.focus();
});

onMounted(async () => {
	await loadMarkov();
	const [firstKey] = datasetKeys;
	if (firstKey) {
		checkedPresets.value = new Set([firstKey]);
		rebuildPresetWords();
	}
	loaded.value = true;
	regenerate();
});
</script>

<template>
	<AppWindow ref="appWindow" app-i-d="namegen">
		<div class="root">
			<div v-if="!loaded" class="loading">loading name generator...</div>

			<template v-else>
				<div class="panels">
					<div class="presets">
						<h3 class="heading">Datasets</h3>
						<div class="preset-list">
							<label
								v-for="key in datasetKeys"
								:key="key"
								class="preset-item"
								:class="{ checked: checkedPresets.has(key) }">
								<input type="checkbox" :checked="checkedPresets.has(key)" @change="togglePreset(key)" />
								<span class="preset-label">{{ key }}</span>
								<span class="preset-count">{{ getPreset(key).length }}</span>
							</label>
						</div>
					</div>

					<div class="main">
						<div class="control-group">
							<label for="words">
								Current Data
								<span class="word-count">{{ wordCount }} words</span>
							</label>
							<textarea id="words" ref="wordsTextarea" v-model="presetWords" rows="8" spellcheck="false">
							</textarea>
						</div>

						<div class="controls">
							<span
								title="Highest order of model to use - models of order 1 through order will be generated.">
								<Scrollbar
									orientation="horizontal"
									:label="`Order: ${order}`"
									:min="1"
									:max="9"
									:thumb-position="fractionFor(order, 1, 9)"
									:thumb-size="0.02"
									@drag="(v: number) => (order = Math.round(v))" />
							</span>
							<span title="The dirichlet prior/additive smoothing randomness factor.">
								<Scrollbar
									orientation="horizontal"
									:label="`Prior: ${prior.toFixed(3)}`"
									:min="0"
									:max="0.05"
									:thumb-position="fractionFor(prior, 0, 0.05)"
									:thumb-size="0.02"
									@drag="(v: number) => (prior = v)" />
							</span>
							<span title="The minimum length of the words.">
								<Scrollbar
									orientation="horizontal"
									:label="`Min Length: ${minLength}`"
									:min="2"
									:max="25"
									:thumb-position="fractionFor(minLength, 2, 25)"
									:thumb-size="0.02"
									@drag="(v: number) => (minLength = Math.round(v))" />
							</span>
							<span title="The maximum length of the words.">
								<Scrollbar
									orientation="horizontal"
									:label="`Max Length: ${maxLength}`"
									:min="2"
									:max="25"
									:thumb-position="fractionFor(maxLength, 2, 25)"
									:thumb-size="0.02"
									@drag="(v: number) => (maxLength = Math.round(v))" />
							</span>
							<span title="Amount of words to try generate.">
								<Scrollbar
									orientation="horizontal"
									:label="`Generate: ${count}`"
									:min="10"
									:max="500"
									:thumb-position="fractionFor(count, 10, 500)"
									:thumb-size="0.02"
									@drag="(v: number) => (count = Math.round(v / 10) * 10)" />
							</span>

							<div class="checkbox-row">
								<label
									title="Whether to fall back to lower order models when the highest order model fails to generate a letter.">
									<input v-model="backoff" type="checkbox" />
									Backoff
								</label>
								<label>
									<input v-model="autoUpdate" type="checkbox" />
									Auto Update
								</label>
							</div>

							<Button @click="regenerate">Generate</Button>
						</div>
					</div>
				</div>

				<div class="results">
					<label for="output">
						Output
						<span class="word-count">{{ names.length }} words</span>
					</label>
					<textarea id="output" class="output-textarea" :value="outputText" readonly spellcheck="false">
					</textarea>
				</div>
			</template>
		</div>
	</AppWindow>
</template>

<style scoped>
.root {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 8px;
	height: 100%;
	overflow: hidden;

	& .loading {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 48px 16px;
		font-style: italic;
		opacity: 0.6;
	}

	& .heading {
		margin: 0;
		font-size: 11px;
		font-weight: 600;
	}

	& .panels {
		display: flex;
		gap: 8px;
		flex: 2;
		min-height: 0;
		overflow: hidden;
	}

	& .presets {
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 220px;
		flex-shrink: 0;
		overflow: hidden;

		& .preset-list {
			flex: 1;
			overflow-y: auto;
			border: 1px solid #808080;

			& .preset-item {
				display: flex;
				align-items: center;
				gap: 5px;
				padding: 2px 6px;
				cursor: pointer;
				font-size: 11px;
				border-bottom: 1px solid rgba(0, 0, 0, 0.1);

				&:hover {
					background: rgba(0, 0, 0, 0.04);
				}

				&.checked {
					background: rgba(0, 0, 0, 0.08);
				}

				& input[type='checkbox'] {
					flex-shrink: 0;
				}

				& .preset-label {
					flex: 1;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}

				& .preset-count {
					flex-shrink: 0;
					font-size: 10px;
					opacity: 0.6;
				}
			}
		}
	}

	& .main {
		display: flex;
		flex-direction: column;
		gap: 6px;
		flex: 1;
		min-width: 0;
		overflow: hidden;

		& .controls {
			display: flex;
			flex-direction: column;
			gap: 2px;
			padding: 6px;
			border: 1px solid #808080;
			flex-shrink: 0;
		}

		& > .control-group {
			display: flex;
			flex-direction: column;
			gap: 2px;
			flex: 1;
			min-height: 0;

			& label {
				font-size: 11px;
				font-weight: 600;
			}
		}
	}

	& .word-count {
		font-weight: 400;
		opacity: 0.6;
		margin-left: 6px;
	}

	& .controls :deep(.scrollbar-wrapper) {
		flex-direction: column;
		align-items: stretch;
		gap: 1px;
	}

	& .controls :deep(.scrollbar-label) {
		min-width: 0;
		text-align: left;
		font-size: 10px;
		padding: 0;
		line-height: 14px;
	}

	& .controls :deep(.scrollbar) {
		height: 12px;
		flex: 1;
	}

	& .checkbox-row {
		display: flex;
		justify-content: center;
		gap: 14px;
		padding: 2px 0;

		& label {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			font-size: 11px;
			cursor: pointer;
		}
	}

	& #words {
		flex: 1;
		min-height: 0;
		box-sizing: border-box;
		padding: 4px 6px;
		border: 1px solid #808080;
		font-size: 13px;
		resize: none;
		text-transform: lowercase;

		&:focus {
			outline: 1px solid #000;
		}
	}

	& .results {
		display: flex;
		flex-direction: column;
		flex: 0 0 30%;
		gap: 2px;
		margin-bottom: 9px;
		min-height: 0;
		overflow: hidden;

		& > label {
			font-size: 11px;
			font-weight: 600;
			padding: 4px 6px 0;
		}

		& .output-textarea {
			flex: 1;
			min-height: 0;
			box-sizing: border-box;
			padding: 0 6px 5px;
			border: 1px solid #808080;
			font-size: 13px;
			resize: none;
			text-transform: lowercase;

			&:focus {
				outline: none;
			}
		}
	}
}
</style>
