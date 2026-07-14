<script setup lang="ts">
import { Scrollbar } from '@os-gui';
import { useGpuIO } from '@composables/useGpuIO';
import { inject, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { get, useEventListener, useMouseInElement } from '@vueuse/core';
import { FLOAT, GPULayer, GPUProgram, renderAmplitudeProgram } from 'gpu-io';
import type { Ref } from 'vue';

const { composer: composerRef, canvas: canvasRef, registerLoop, unregisterLoop, onResize } = useGpuIO();
const { elementX, elementY, elementWidth, elementHeight, isOutside } = useMouseInElement(canvasRef);
const gpuioActions = inject<{ reset?: () => void; applyPreset?: (name: string) => void }>('gpuio-actions', {});
const showControls = inject<Ref<boolean>>('gpuio-showControls', ref(true));
const pendingPreset = inject<Ref<string | null>>('gpuio-pendingPreset', ref<string | null>(null));

const cReal = ref(0.38);
const cImaginary = ref(-0.23);
const maxIters = ref(500);
const RADIUS = 1.75;

let bounds: { min: [number, number]; max: [number, number] } = { min: [-1.75, -1.75], max: [1.75, 1.75] };

let needsCompute = true;

let state: GPULayer | null = null;
let fractalCompute: GPUProgram | null = null;
let fractalRender: GPUProgram | null = null;

function calcInitialBounds(): { min: [number, number]; max: [number, number] } {
	const canvas = get(canvasRef);
	if (!canvas) {
		return { min: [-RADIUS, -RADIUS], max: [RADIUS, RADIUS] };
	}
	const aspectRatio = canvas.width / canvas.height;
	if (aspectRatio > 1) {
		return { min: [-RADIUS * aspectRatio, -RADIUS], max: [RADIUS * aspectRatio, RADIUS] };
	}
	return { min: [-RADIUS, -RADIUS / aspectRatio], max: [RADIUS, RADIUS / aspectRatio] };
}

function syncBounds(): void {
	if (!fractalCompute) {
		return;
	}
	fractalCompute.setUniform('u_boundsMin', bounds.min);
	fractalCompute.setUniform('u_boundsMax', bounds.max);
	needsCompute = true;
}

function loop(): void {
	const composer = get(composerRef);
	if (!composer || !fractalCompute || !fractalRender || !state) {
		return;
	}
	if (needsCompute) {
		composer.step({ program: fractalCompute, output: state });
		needsCompute = false;
		composer.step({ program: fractalRender, input: state });
	}
}

let isPanning = false;
let lastPanPos: [number, number] = [0, 0];

function onPointerDown(e: PointerEvent): void {
	e.preventDefault();
	if (e.button !== null) {
		isPanning = true;
		lastPanPos = [e.offsetX, e.offsetY];
	}
}

function onPointerMove(e: PointerEvent): void {
	if (!isPanning) {
		return;
	}
	e.preventDefault();
	const dx = e.offsetX - lastPanPos[0];
	const dy = e.offsetY - lastPanPos[1];
	if (!get(canvasRef)) {
		return;
	}
	const [minX, minY] = bounds.min;
	const [maxX, maxY] = bounds.max;
	const scaleX = maxY - minY;
	const scaleY = maxX - minX;
	bounds.min = [minX - scaleY * (dx / get(elementWidth)), minY + scaleX * (dy / get(elementHeight))];
	bounds.max = [maxX - scaleY * (dx / get(elementWidth)), maxY + scaleX * (dy / get(elementHeight))];
	syncBounds();
	lastPanPos = [e.offsetX, e.offsetY];
}

function onPointerUp(): void {
	isPanning = false;
}

function onContextMenu(e: Event): void {
	e.preventDefault();
}

function onWheel(e: WheelEvent): void {
	e.preventDefault();
	if (get(isOutside)) {
		return;
	}
	const localX = get(elementX);
	const localY = get(elementY);
	const [minX, minY] = bounds.min;
	const [maxX, maxY] = bounds.max;
	let scaleX = maxY - minY;
	let scaleY = maxX - minX;
	const fractionY = (get(elementHeight) - localY) / get(elementHeight);
	const fractionX = localX / get(elementWidth);
	const centerY = fractionY * scaleX + minY;
	const centerX = fractionX * scaleY + minX;
	const scale = 1 + e.deltaY * 0.001;
	const scaleLimit = 1e-4;
	if (Math.min(scaleX * scale, scaleY * scale) < scaleLimit) {
		return;
	}
	scaleX *= scale;
	scaleY *= scale;
	bounds.min = [centerX - scaleY * fractionX, centerY - scaleX * fractionY];
	bounds.max = [centerX + scaleY * (1 - fractionX), centerY + scaleX * (1 - fractionY)];
	syncBounds();
}

const presets: Record<string, { cr: number; ci: number }> = {
	Spiral: { cr: -0.77, ci: 0.06 },
	Dendrite: { cr: -0.05, ci: 0.67 },
	Standard: { cr: 0.38, ci: -0.23 }
};

function applyPreset(name: string): void {
	const p = presets[name];
	if (!p) {
		return;
	}
	cReal.value = p.cr;
	cImaginary.value = p.ci;
	if (fractalCompute) {
		fractalCompute.setUniform('u_cReal', p.cr);
		fractalCompute.setUniform('u_cImaginary', p.ci);
	}
	bounds = calcInitialBounds();
	syncBounds();
}

watch(cReal, () => {
	fractalCompute?.setUniform('u_cReal', get(cReal));
	needsCompute = true;
});
watch(cImaginary, () => {
	fractalCompute?.setUniform('u_cImaginary', get(cImaginary));
	needsCompute = true;
});
watch(maxIters, () => {
	fractalCompute?.recompile({ MAX_ITERS: `${get(maxIters)}` });
	needsCompute = true;
});

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

	bounds = calcInitialBounds();

	state = new GPULayer(composer, {
		name: 'state',
		dimensions: [canvas.width, canvas.height],
		type: FLOAT,
		numComponents: 1
	});

	fractalCompute = new GPUProgram(composer, {
		name: 'fractalCompute',
		fragmentShader: `
			#define SUBSAMPLE_RES 2.0
			in vec2 v_uv;
			uniform vec2 u_boundsMin;
			uniform vec2 u_boundsMax;
			uniform float u_cReal;
			uniform float u_cImaginary;
			uniform vec2 u_pxSize;
			out float out_value;

			void main() {
				int value = 0;
				for (float u = 0.0; u < SUBSAMPLE_RES; u++) {
					for (float v = 0.0; v < SUBSAMPLE_RES; v++) {
						vec2 uvOffset = vec2(u, v) / (SUBSAMPLE_RES + 1.0) + 0.5;
						vec2 uv = v_uv + uvOffset * u_pxSize;
						vec2 z = uv * u_boundsMax + (1.0 - uv) * u_boundsMin;
						for (int i = 0; i < MAX_ITERS; i++) {
							if (z.x * z.x + z.y * z.y > ${RADIUS * RADIUS}) break;
							float xTemp = z.x * z.x - z.y * z.y;
							z.y = 2.0 * z.x * z.y + u_cImaginary;
							z.x = xTemp + u_cReal;
							value += 1;
						}
					}
				}
				out_value = (float(value) / (SUBSAMPLE_RES * SUBSAMPLE_RES)) / float(MAX_ITERS);
			}`,
		uniforms: [
			{ name: 'u_boundsMin', value: bounds.min, type: FLOAT },
			{ name: 'u_boundsMax', value: bounds.max, type: FLOAT },
			{ name: 'u_cReal', value: get(cReal), type: FLOAT },
			{ name: 'u_cImaginary', value: get(cImaginary), type: FLOAT },
			{ name: 'u_pxSize', value: [1 / canvas.width, 1 / canvas.height], type: FLOAT }
		],
		compileTimeConstants: { MAX_ITERS: `${get(maxIters)}` }
	});

	fractalRender = renderAmplitudeProgram(composer, {
		name: 'render',
		type: state.type,
		components: 'x'
	});

	needsCompute = true;
	registerLoop(loop);
	onResize(() => {
		const cvs = get(canvasRef);
		if (!cvs || !state || !fractalCompute) {
			return;
		}
		state.resize([cvs.width, cvs.height]);
		fractalCompute.setUniform('u_pxSize', [1 / cvs.width, 1 / cvs.height]);
		bounds = calcInitialBounds();
		syncBounds();
	});

	gpuioActions.applyPreset = applyPreset;

	const pending = get(pendingPreset);
	if (pending) {
		pendingPreset.value = null;
		applyPreset(pending);
	}
}

useEventListener(canvasRef, 'pointerdown', onPointerDown);
useEventListener(canvasRef, 'pointermove', onPointerMove);
useEventListener(canvasRef, 'pointerup', onPointerUp);
useEventListener(canvasRef, 'pointerleave', onPointerUp);
useEventListener(canvasRef, 'contextmenu', onContextMenu);
useEventListener(window, 'wheel', onWheel, { passive: false });

onBeforeUnmount(() => {
	stopComposerWatch();
	unregisterLoop();
	gpuioActions.applyPreset = undefined;

	state?.dispose();
	fractalCompute?.dispose();
	fractalRender?.dispose();
	state = null;
	fractalCompute = null;
	fractalRender = null;
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
					<div class="section-header">Julia Constant</div>
					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`C Real: ${cReal.toFixed(3)}`"
							:min="-2"
							:max="2"
							:thumb-position="fractionForParam(cReal, -2, 2)"
							:thumb-size="0.02"
							@drag="(v: number) => (cReal = v)" />
					</div>
					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`C Imag: ${cImaginary.toFixed(3)}`"
							:min="-2"
							:max="2"
							:thumb-position="fractionForParam(cImaginary, -2, 2)"
							:thumb-size="0.02"
							@drag="(v: number) => (cImaginary = v)" />
					</div>
				</div>
				<div class="control-section">
					<div class="section-header">Iterations</div>
					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`Max Iters: ${maxIters}`"
							:min="1"
							:max="1000"
							:thumb-position="fractionForParam(maxIters, 1, 1000)"
							:thumb-size="0.02"
							@drag="(v: number) => (maxIters = Math.round(v))" />
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
			}
		}
	}
}
</style>
