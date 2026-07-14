<script setup lang="ts">
import {
	BYTE,
	copyProgram,
	FLOAT,
	GPULayer,
	GPUProgram,
	INT,
	PRECISION_LOW_P,
	renderAmplitudeProgram,
	REPEAT,
	UINT
} from 'gpu-io';
import { Scrollbar } from '@os-gui';
import { useGpuIO } from '@composables/useGpuIO';
import { get, useEventListener, useMouseInElement } from '@vueuse/core';
import { computed, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { Ref } from 'vue';

const { composer: composerRef, canvas: canvasRef, registerLoop, unregisterLoop, onResize } = useGpuIO();
const gpuioActions = inject<{ reset?: () => void; applyPreset?: (name: string) => void }>('gpuio-actions', {});
const showControls = inject<Ref<boolean>>('gpuio-showControls', ref(true));
const pendingPreset = inject<Ref<string | null>>('gpuio-pendingPreset', ref<string | null>(null));

const s1 = ref(false);
const s2 = ref(true);
const s3 = ref(true);
const s4 = ref(false);
const s5 = ref(false);
const s6 = ref(false);
const s7 = ref(false);
const s8 = ref(false);
const b1 = ref(false);
const b2 = ref(false);
const b3 = ref(true);
const b4 = ref(false);
const b5 = ref(false);
const b6 = ref(false);
const b7 = ref(false);
const b8 = ref(false);

const survivalRules = computed(() => {
	let v = 0;
	if (get(s1)) {
		v |= 1;
	}
	if (get(s2)) {
		v |= 2;
	}
	if (get(s3)) {
		v |= 4;
	}
	if (get(s4)) {
		v |= 8;
	}
	if (get(s5)) {
		v |= 16;
	}
	if (get(s6)) {
		v |= 32;
	}
	if (get(s7)) {
		v |= 64;
	}
	if (get(s8)) {
		v |= 128;
	}
	return v;
});
const birthRules = computed(() => {
	let v = 0;
	if (get(b1)) {
		v |= 1;
	}
	if (get(b2)) {
		v |= 2;
	}
	if (get(b3)) {
		v |= 4;
	}
	if (get(b4)) {
		v |= 8;
	}
	if (get(b5)) {
		v |= 16;
	}
	if (get(b6)) {
		v |= 32;
	}
	if (get(b7)) {
		v |= 64;
	}
	if (get(b8)) {
		v |= 128;
	}
	return v;
});

const seedRatio = ref(0.12);

let state: GPULayer | null = null;
let noise: GPULayer | null = null;
let golRules: GPUProgram | null = null;
let golRender: GPUProgram | null = null;
let touch: GPUProgram | null = null;

function initState(): void {
	if (!state || !noise) {
		return;
	}
	const canvas = get(canvasRef);
	if (!canvas) {
		return;
	}

	const numCells = canvas.width * canvas.height;
	const data = new Uint8Array(numCells);
	for (let i = 0; i < numCells; i++) {
		data[i] = Math.random() < get(seedRatio) ? 1 : 0;
	}
	state.setFromArray(data);
	noise.setFromArray(data);
}

function reset(): void {
	initState();
	if (golRules) {
		golRules.setUniform('u_survivalRules', get(survivalRules));
		golRules.setUniform('u_birthRules', get(birthRules));
	}
}

const isPainting = ref(false);
const { elementX, elementY, isOutside } = useMouseInElement(canvasRef);
const PAINT_DIAMETER = 30;

function onPointerDown(e: PointerEvent): void {
	isPainting.value = true;
	const composer = get(composerRef);
	if (!composer || !touch || !noise || !state) {
		return;
	}
	composer.stepCircle({
		program: touch,
		input: noise,
		output: state,
		position: [e.offsetX, (get(canvasRef)?.height ?? 0) - e.offsetY],
		diameter: PAINT_DIAMETER
	});
}

function onPointerUp(): void {
	isPainting.value = false;
}

function loop(): void {
	const composer = get(composerRef);
	if (!composer || !golRules || !golRender || !state || !touch || !noise) {
		return;
	}

	if (get(isPainting) && !get(isOutside)) {
		const canvas = get(canvasRef);
		if (canvas) {
			composer.stepCircle({
				program: touch,
				input: noise,
				output: state,
				position: [get(elementX), canvas.height - get(elementY)],
				diameter: PAINT_DIAMETER
			});
		}
	}
	composer.step({ program: golRules, input: state, output: state });
	composer.step({ program: golRender, input: state });
}

watch([survivalRules, birthRules], () => {
	golRules?.setUniform('u_survivalRules', get(survivalRules));
	golRules?.setUniform('u_birthRules', get(birthRules));
});

const presets: Record<string, { s: boolean[]; b: boolean[]; seed?: number }> = {
	"Conway's Rules": {
		s: [false, true, true, false, false, false, false, false],
		b: [false, false, true, false, false, false, false, false]
	},
	'Seeds': {
		s: [false, false, false, false, false, false, false, false],
		b: [false, true, false, false, false, false, false, false],
		seed: 0.04
	},
	'HighLife': {
		s: [false, true, true, false, false, false, false, false],
		b: [false, false, true, false, false, true, false, false]
	}
};

function applyPreset(name: string): void {
	const p = presets[name];
	if (!p) {
		return;
	}
	s1.value = p.s[0]!;
	s2.value = p.s[1]!;
	s3.value = p.s[2]!;
	s4.value = p.s[3]!;
	s5.value = p.s[4]!;
	s6.value = p.s[5]!;
	s7.value = p.s[6]!;
	s8.value = p.s[7]!;
	b1.value = p.b[0]!;
	b2.value = p.b[1]!;
	b3.value = p.b[2]!;
	b4.value = p.b[3]!;
	b5.value = p.b[4]!;
	b6.value = p.b[5]!;
	b7.value = p.b[6]!;
	b8.value = p.b[7]!;
	if (p.seed !== undefined) {
		seedRatio.value = p.seed;
	}
	initState();
	if (golRules) {
		golRules.setUniform('u_survivalRules', get(survivalRules));
		golRules.setUniform('u_birthRules', get(birthRules));
	}
}

const stopComposerWatch = watch(
	() => get(composerRef),
	async (c) => {
		if (c && !state) {
			await nextTick();
			await initSimulation();
		}
	},
	{ immediate: true }
);

async function initSimulation(): Promise<void> {
	const composer = get(composerRef);
	const canvas = get(canvasRef);
	if (!composer || !canvas) {
		return;
	}

	const dims: [number, number] = [canvas.width, canvas.height];

	state = new GPULayer(composer, {
		name: 'state',
		dimensions: dims,
		numComponents: 1,
		type: BYTE,
		numBuffers: 2,
		wrapX: REPEAT,
		wrapY: REPEAT
	});

	golRules = new GPUProgram(composer, {
		name: 'golRules',
		fragmentShader: `
			in vec2 v_uv;
			uniform vec2 u_pxSize;
			uniform lowp isampler2D u_state;
			uniform lowp uint u_survivalRules;
			uniform lowp uint u_birthRules;
			out lowp int out_state;

			void main() {
				lowp int state = int(texture(u_state, v_uv).r);
				lowp int n = int(texture(u_state, v_uv + vec2(0, u_pxSize[1])).r);
				lowp int s = int(texture(u_state, v_uv + vec2(0, -u_pxSize[1])).r);
				lowp int e = int(texture(u_state, v_uv + vec2(u_pxSize[0], 0)).r);
				lowp int w = int(texture(u_state, v_uv + vec2(-u_pxSize[0], 0)).r);
				lowp int ne = int(texture(u_state, v_uv + vec2(u_pxSize[0], u_pxSize[1])).r);
				lowp int nw = int(texture(u_state, v_uv + vec2(-u_pxSize[0], u_pxSize[1])).r);
				lowp int se = int(texture(u_state, v_uv + vec2(u_pxSize[0], -u_pxSize[1])).r);
				lowp int sw = int(texture(u_state, v_uv + vec2(-u_pxSize[0], -u_pxSize[1])).r);
				lowp int numLiving = n + s + e + w + ne + nw + se + sw;

				lowp uint mask = bitwiseAnd8((u_survivalRules * uint(state) + u_birthRules * uint(1 - state)), uint(bitshiftLeft(1, numLiving - 1)));
				state = min(int(mask), 1);
				out_state = state;
			}`,
		uniforms: [
			{ name: 'u_state', value: 0, type: INT },
			{ name: 'u_pxSize', value: [1 / canvas.width, 1 / canvas.height], type: FLOAT },
			{ name: 'u_survivalRules', value: get(survivalRules), type: UINT },
			{ name: 'u_birthRules', value: get(birthRules), type: UINT }
		]
	});

	golRender = renderAmplitudeProgram(composer, {
		name: 'render',
		type: state.type,
		components: 'x',
		precision: PRECISION_LOW_P
	});

	noise = new GPULayer(composer, {
		name: 'noise',
		dimensions: dims,
		numComponents: 1,
		type: BYTE,
		numBuffers: 1,
		wrapX: REPEAT,
		wrapY: REPEAT
	});

	touch = copyProgram(composer, {
		name: 'touch',
		type: noise.type,
		precision: PRECISION_LOW_P
	});

	initState();
	registerLoop(loop);
	onResize(() => {
		if (!state || !noise || !golRules) {
			return;
		}
		const cvs = get(canvasRef);
		if (!cvs) {
			return;
		}
		state.resize([cvs.width, cvs.height]);
		noise.resize([cvs.width, cvs.height]);
		golRules.setUniform('u_pxSize', [1 / cvs.width, 1 / cvs.height]);
		initState();
	});

	gpuioActions.applyPreset = applyPreset;

	const pending = get(pendingPreset);
	if (pending) {
		pendingPreset.value = null;
		applyPreset(pending);
	}
}

useEventListener(canvasRef, 'pointerdown', onPointerDown);
useEventListener(canvasRef, 'pointerup', onPointerUp);
useEventListener(canvasRef, 'pointerleave', onPointerUp);

onBeforeUnmount(() => {
	stopComposerWatch();
	unregisterLoop();
	gpuioActions.applyPreset = undefined;

	state?.dispose();
	noise?.dispose();
	golRules?.dispose();
	golRender?.dispose();
	touch?.dispose();
	state = null;
	noise = null;
	golRules = null;
	golRender = null;
	touch = null;
});

function toggleRule(r: Ref<boolean>): void {
	r.value = !get(r);
}

const survivalSlots = [
	{ ref: s1, label: 'S1' },
	{ ref: s2, label: 'S2' },
	{ ref: s3, label: 'S3' },
	{ ref: s4, label: 'S4' },
	{ ref: s5, label: 'S5' },
	{ ref: s6, label: 'S6' },
	{ ref: s7, label: 'S7' },
	{ ref: s8, label: 'S8' }
];
const birthSlots = [
	{ ref: b1, label: 'B1' },
	{ ref: b2, label: 'B2' },
	{ ref: b3, label: 'B3' },
	{ ref: b4, label: 'B4' },
	{ ref: b5, label: 'B5' },
	{ ref: b6, label: 'B6' },
	{ ref: b7, label: 'B7' },
	{ ref: b8, label: 'B8' }
];
</script>

<template>
	<div v-if="composerRef" class="root">
		<div v-if="showControls" class="controls">
			<button class="hide-btn" @click="showControls = false">✕</button>
			<div class="controls-scroll">
				<div class="control-section">
					<div class="section-header">Survival Rules</div>
					<div class="rule-grid">
						<button
							v-for="slot in survivalSlots"
							:key="slot.label"
							:class="['rule-btn', { active: get(slot.ref) }]"
							@click="toggleRule(slot.ref)">
							{{ slot.label }}
						</button>
					</div>
				</div>
				<div class="control-section">
					<div class="section-header">Birth Rules</div>
					<div class="rule-grid">
						<button
							v-for="slot in birthSlots"
							:key="slot.label"
							:class="['rule-btn', { active: get(slot.ref) }]"
							@click="toggleRule(slot.ref)">
							{{ slot.label }}
						</button>
					</div>
				</div>
				<div class="control-section">
					<div class="section-header">Seed</div>
					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`Seed Ratio: ${seedRatio.toFixed(2)}`"
							:min="0.01"
							:max="1"
							:thumb-position="(seedRatio - 0.01) / 0.99"
							:thumb-size="0.02"
							@drag="(v: number) => (seedRatio = v)"
							@drag-end="reset()" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.root {
	position: absolute;
	inset: 0;
	pointer-events: none;

	& .controls {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 220px;
		max-height: calc(100% - 16px);
		pointer-events: auto;
		background: rgba(42, 42, 42, 0.92);
		backdrop-filter: blur(6px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
		z-index: 10;
		display: flex;
		flex-direction: column;
		font-family: 'Segoe UI', Tahoma, sans-serif;

		& .hide-btn {
			position: absolute;
			top: 2px;
			right: 4px;
			z-index: 1;
			background: none;
			border: none;
			color: #555;
			font-size: 12px;
			cursor: pointer;
			padding: 0 2px;
			line-height: 1;

			&:hover {
				color: #ccc;
			}
		}

		& .controls-scroll {
			padding: 4px 6px;
			overflow-y: auto;
			flex: 1;

			& .control-section {
				margin-bottom: 6px;

				& .section-header {
					font-size: 10px;
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 0.5px;
					color: #999;
					padding: 3px 0 1px 0;
					margin-bottom: 2px;
					border-bottom: 1px solid rgba(255, 255, 255, 0.06);
				}

				& .rule-grid {
					display: flex;
					flex-wrap: wrap;
					gap: 2px;

					& .rule-btn {
						font-size: 9px;
						padding: 2px 5px;
						border: 1px solid rgba(255, 255, 255, 0.15);
						border-radius: 2px;
						background: rgba(255, 255, 255, 0.05);
						color: #777;
						cursor: pointer;
						min-width: 24px;
						text-align: center;

						&.active {
							background: rgba(100, 180, 255, 0.25);
							color: #a0d0ff;
							border-color: rgba(100, 180, 255, 0.4);
						}

						&:hover {
							background: rgba(255, 255, 255, 0.1);
						}
					}
				}

				& .control-row {
					margin-bottom: 3px;

					& :deep(.scrollbar-wrapper) {
						flex-direction: column;
						align-items: stretch;
						gap: 1px;
					}
					& :deep(.scrollbar-label) {
						min-width: 0;
						text-align: left;
						font-size: 10px;
						padding: 0;
						color: #bbb;
						line-height: 14px;
					}
					& :deep(.scrollbar) {
						height: 13px;
					}
					& :deep(.scrollbar-track) {
						background: rgba(255, 255, 255, 0.06);
						border: 1px solid rgba(255, 255, 255, 0.08);
					}
				}
			}
		}
	}
}
</style>
