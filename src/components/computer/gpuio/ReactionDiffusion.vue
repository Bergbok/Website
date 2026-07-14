<script setup lang="ts">
import {
	CLAMP_TO_EDGE,
	FLOAT,
	GPULayer,
	GPUProgram,
	INT,
	LINEAR,
	renderAmplitudeProgram,
	setValueProgram
} from 'gpu-io';
import { Scrollbar } from '@os-gui';
import { useGpuIO } from '@composables/useGpuIO';
import { get, useEventListener, useMouseInElement } from '@vueuse/core';
import { inject, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { Ref } from 'vue';

const { composer: composerRef, canvas: canvasRef, registerLoop, unregisterLoop, onResize } = useGpuIO();
const gpuioActions = inject<{ reset?: () => void; applyPreset?: (name: string) => void }>('gpuio-actions', {});
const showControls = inject<Ref<boolean>>('gpuio-showControls', ref(true));
const pendingPreset = inject<Ref<string | null>>('gpuio-pendingPreset', ref<string | null>(null));

const diffusionA = ref(0.2097);
const diffusionB = ref(0.105);
const removalRateMin = ref(0.05);
const removalRateMax = ref(0.066);
const feedRateMin = ref(0.016);
const feedRateMax = ref(0.044);
const renderLayer = ref<'Chemical A' | 'Chemical B'>('Chemical B');

const SIM_SCALE = 1.5;
const NUM_SUBSTEPS = 10;

let state: GPULayer | null = null;
let rxnDiffusion: GPUProgram | null = null;
let renderA: GPUProgram | null = null;
let renderB: GPUProgram | null = null;
let touchProgram: GPUProgram | null = null;

function simDimensions(): [number, number] {
	const canvas = get(canvasRef);
	if (!canvas) {
		return [100, 100];
	}
	return [Math.round(canvas.width / SIM_SCALE), Math.round(canvas.height / SIM_SCALE)];
}

function initState(): void {
	if (!state) {
		return;
	}
	const [w, h] = simDimensions();
	const data = new Float32Array(w * h * 2);
	for (let i = 0; i < w * h; i++) {
		data[2 * i] = Math.random();
		data[2 * i + 1] = Math.random();
	}
	state.setFromArray(data);
}

function syncUniforms(): void {
	if (!rxnDiffusion || !state) {
		return;
	}
	const canvas = get(canvasRef);
	if (!canvas) {
		return;
	}
	rxnDiffusion.setUniform('u_pxSize', [SIM_SCALE / canvas.width, SIM_SCALE / canvas.height]);
	rxnDiffusion.setUniform('u_diffusionA', get(diffusionA));
	rxnDiffusion.setUniform('u_diffusionB', get(diffusionB));
	rxnDiffusion.setUniform('u_feedRateBounds', [get(feedRateMin), get(feedRateMax)]);
	rxnDiffusion.setUniform('u_removalRateBounds', [get(removalRateMin), get(removalRateMax)]);
}

const isPainting = ref(false);
const { elementX, elementY, isOutside } = useMouseInElement(canvasRef);
const PAINT_DIAMETER = 20;

function onPointerDown(e: PointerEvent): void {
	isPainting.value = true;
	const composer = get(composerRef);
	if (!composer || !touchProgram || !state) {
		return;
	}
	const canvas = get(canvasRef);
	if (!canvas) {
		return;
	}
	composer.stepCircle({
		program: touchProgram,
		input: state,
		output: state,
		position: [e.offsetX, canvas.height - e.offsetY],
		diameter: PAINT_DIAMETER
	});
}

function onPointerUp(): void {
	isPainting.value = false;
}

function loop(): void {
	const composer = get(composerRef);
	if (!composer || !rxnDiffusion || !state) {
		return;
	}
	if (get(isPainting) && !get(isOutside) && touchProgram) {
		const canvas = get(canvasRef);
		if (canvas) {
			composer.stepCircle({
				program: touchProgram,
				input: state,
				output: state,
				position: [get(elementX), canvas.height - get(elementY)],
				diameter: PAINT_DIAMETER
			});
		}
	}
	for (let i = 0; i < NUM_SUBSTEPS; i++) {
		composer.step({ program: rxnDiffusion, input: state, output: state });
	}
	const renderProg = get(renderLayer) === 'Chemical A' ? renderA : renderB;
	if (renderProg) {
		composer.step({ program: renderProg, input: state });
	}
}

watch([diffusionA, diffusionB, removalRateMin, removalRateMax, feedRateMin, feedRateMax], () => syncUniforms());

const presets: Record<string, { dA: number; dB: number; rMin: number; rMax: number; fMin: number; fMax: number }> = {
	Default: { dA: 0.2097, dB: 0.105, rMin: 0.05, rMax: 0.066, fMin: 0.016, fMax: 0.044 },
	Coral: { dA: 0.21, dB: 0.105, rMin: 0.0545, rMax: 0.062, fMin: 0.014, fMax: 0.047 },
	Spots: { dA: 0.16, dB: 0.08, rMin: 0.035, rMax: 0.065, fMin: 0.01, fMax: 0.05 },
	Waves: { dA: 0.14, dB: 0.06, rMin: 0.04, rMax: 0.07, fMin: 0.02, fMax: 0.055 }
};

function applyPreset(name: string): void {
	const p = presets[name];
	if (!p) {
		return;
	}
	diffusionA.value = p.dA;
	diffusionB.value = p.dB;
	removalRateMin.value = p.rMin;
	removalRateMax.value = p.rMax;
	feedRateMin.value = p.fMin;
	feedRateMax.value = p.fMax;
	initState();
	syncUniforms();
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

	const dims = simDimensions();

	state = new GPULayer(composer, {
		name: 'state',
		dimensions: dims,
		numComponents: 2,
		type: FLOAT,
		filter: LINEAR,
		numBuffers: 2,
		wrapX: CLAMP_TO_EDGE,
		wrapY: CLAMP_TO_EDGE
	});

	rxnDiffusion = new GPUProgram(composer, {
		name: 'rxnDiffusion',
		fragmentShader: `
			in vec2 v_uv;
			uniform sampler2D u_state;
			uniform vec2 u_pxSize;
			uniform vec2 u_feedRateBounds;
			uniform vec2 u_removalRateBounds;
			uniform float u_diffusionA;
			uniform float u_diffusionB;
			out vec2 out_state;

			void main() {
				vec2 state = texture(u_state, v_uv).xy;
				vec2 n = texture(u_state, v_uv + vec2(u_pxSize.x, 0)).xy;
				vec2 s = texture(u_state, v_uv + vec2(-u_pxSize.x, 0)).xy;
				vec2 e = texture(u_state, v_uv + vec2(0, u_pxSize.y)).xy;
				vec2 w = texture(u_state, v_uv + vec2(0, -u_pxSize.y)).xy;
				vec2 laplacian = (n + s + e + w) - 4.0 * state;

				float reaction = state.x * state.y * state.y;
				float removalRate = mix(u_removalRateBounds.x, u_removalRateBounds.y, v_uv.x);
				float feedRate = mix(u_feedRateBounds.x, u_feedRateBounds.y, v_uv.y);
				out_state = clamp(state + vec2(
					u_diffusionA * laplacian.x - reaction + feedRate * (1.0 - state.x),
					u_diffusionB * laplacian.y + reaction - (removalRate + feedRate) * state.y
				), 0.0, 1.0);
			}`,
		uniforms: [
			{ name: 'u_state', value: 0, type: INT },
			{ name: 'u_pxSize', value: [SIM_SCALE / canvas.width, SIM_SCALE / canvas.height], type: FLOAT },
			{ name: 'u_feedRateBounds', value: [get(feedRateMin), get(feedRateMax)], type: FLOAT },
			{ name: 'u_removalRateBounds', value: [get(removalRateMin), get(removalRateMax)], type: FLOAT },
			{ name: 'u_diffusionA', value: get(diffusionA), type: FLOAT },
			{ name: 'u_diffusionB', value: get(diffusionB), type: FLOAT }
		]
	});

	renderA = renderAmplitudeProgram(composer, { name: 'renderA', type: state.type, scale: 1, components: 'x' });
	renderB = renderAmplitudeProgram(composer, { name: 'renderB', type: state.type, scale: 3, components: 'y' });

	touchProgram = setValueProgram(composer, { name: 'touch', type: state.type, value: [0.5, 0.5] });

	initState();
	registerLoop(loop);
	onResize(() => {
		if (!state) {
			return;
		}
		state.resize(simDimensions());
		initState();
		syncUniforms();
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
	rxnDiffusion?.dispose();
	renderA?.dispose();
	renderB?.dispose();
	touchProgram?.dispose();
	state = null;
	rxnDiffusion = null;
	renderA = null;
	renderB = null;
	touchProgram = null;
});

function fractionForParam(value: number, min: number, max: number): number {
	return (value - min) / (max - min);
}
</script>

<template>
	<div v-if="composerRef" class="root">
		<div v-if="showControls" class="controls">
			<button class="hide-btn" @click="showControls = false">✕</button>
			<div class="controls-scroll">
				<div class="control-section">
					<div class="section-header">Diffusion</div>
					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`Diff A: ${diffusionA.toFixed(4)}`"
							:min="0.05"
							:max="0.22"
							:thumb-position="fractionForParam(diffusionA, 0.05, 0.22)"
							:thumb-size="0.02"
							@drag="(v: number) => (diffusionA = v)" />
					</div>
					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`Diff B: ${diffusionB.toFixed(4)}`"
							:min="0.05"
							:max="0.2"
							:thumb-position="fractionForParam(diffusionB, 0.05, 0.2)"
							:thumb-size="0.02"
							@drag="(v: number) => (diffusionB = v)" />
					</div>
				</div>
				<div class="control-section">
					<div class="section-header">Removal Rate (K)</div>
					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`K Min: ${removalRateMin.toFixed(4)}`"
							:min="0"
							:max="0.1"
							:thumb-position="fractionForParam(removalRateMin, 0, 0.1)"
							:thumb-size="0.02"
							@drag="(v: number) => (removalRateMin = v)" />
					</div>
					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`K Max: ${removalRateMax.toFixed(4)}`"
							:min="0"
							:max="0.1"
							:thumb-position="fractionForParam(removalRateMax, 0, 0.1)"
							:thumb-size="0.02"
							@drag="(v: number) => (removalRateMax = v)" />
					</div>
				</div>
				<div class="control-section">
					<div class="section-header">Feed Rate (F)</div>
					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`F Min: ${feedRateMin.toFixed(4)}`"
							:min="0"
							:max="0.1"
							:thumb-position="fractionForParam(feedRateMin, 0, 0.1)"
							:thumb-size="0.02"
							@drag="(v: number) => (feedRateMin = v)" />
					</div>
					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`F Max: ${feedRateMax.toFixed(4)}`"
							:min="0"
							:max="0.1"
							:thumb-position="fractionForParam(feedRateMax, 0, 0.1)"
							:thumb-size="0.02"
							@drag="(v: number) => (feedRateMax = v)" />
					</div>
				</div>
				<div class="control-section">
					<div class="section-header">Render</div>
					<div class="control-row toggle-row">
						<button
							:class="['toggle-btn', { active: renderLayer === 'Chemical A' }]"
							@click="renderLayer = 'Chemical A'">
							Chem A
						</button>
						<button
							:class="['toggle-btn', { active: renderLayer === 'Chemical B' }]"
							@click="renderLayer = 'Chemical B'">
							Chem B
						</button>
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
		width: 240px;
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

				& .toggle-row {
					display: flex;
					gap: 4px;

					& .toggle-btn {
						flex: 1;
						font-size: 10px;
						padding: 2px 6px;
						border: 1px solid rgba(255, 255, 255, 0.15);
						border-radius: 2px;
						background: rgba(255, 255, 255, 0.05);
						color: #777;
						cursor: pointer;

						&.active {
							background: rgba(100, 180, 255, 0.2);
							color: #a0d0ff;
							border-color: rgba(100, 180, 255, 0.35);
						}
					}
				}
			}
		}
	}
}
</style>
