<script setup lang="ts">
import {
	addValueProgram,
	BOOL,
	FLOAT,
	GPULayer,
	GPUProgram,
	INT,
	LINEAR,
	renderAmplitudeProgram,
	REPEAT
} from 'gpu-io';
import { Scrollbar } from '@os-gui';
import { get, useEventListener } from '@vueuse/core';
import { useGpuIO } from '@composables/useGpuIO';
import { computed, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { Ref } from 'vue';

const { composer: composerRef, canvas: canvasRef, registerLoop, unregisterLoop, onResize } = useGpuIO();
const gpuioActions = inject<{ reset?: () => void; applyPreset?: (name: string) => void }>('gpuio-actions', {});
const showControls = inject<Ref<boolean>>('gpuio-showControls', ref(true));
const pendingPreset = inject<Ref<string | null>>('gpuio-pendingPreset', ref<string | null>(null));

const decayFactor = ref(0.9);
const depositAmount = ref(4);
const particleDensity = ref(0.35);
const sensorDistance = ref(18);
const sensorAngle = ref(5.5);
const stepSize = ref(2);
const rotationAngle = ref(45);
const renderAmplitude = ref(0.03);

const PARTICLES_NUM_COMPONENTS = 4;

let particlesPositions: GPULayer | null = null;
let particlesHeading: GPULayer | null = null;
let trail: GPULayer | null = null;
let updateParticles: GPUProgram | null = null;
let deposit: GPUProgram | null = null;
let diffuseAndDecay: GPUProgram | null = null;
let render: GPUProgram | null = null;

function initParticlesArrays(): { positions: Float32Array; heading: Float32Array; numParticles: number } {
	const canvas = get(canvasRef);
	if (!canvas) {
		return { positions: new Float32Array(0), heading: new Float32Array(0), numParticles: 0 };
	}
	const { width } = canvas;
	const { height } = canvas;
	const numParticles = Math.round(width * height * get(particleDensity));
	const positions = new Float32Array(numParticles * PARTICLES_NUM_COMPONENTS);
	const heading = new Float32Array(numParticles);
	for (let i = 0; i < numParticles; i++) {
		positions[PARTICLES_NUM_COMPONENTS * i] = Math.random() * width;
		positions[PARTICLES_NUM_COMPONENTS * i + 1] = Math.random() * height;
		positions[PARTICLES_NUM_COMPONENTS * i + 2] = 0;
		positions[PARTICLES_NUM_COMPONENTS * i + 3] = 0;
		heading[i] = Math.random() * Math.PI * 2;
	}
	return { positions, heading, numParticles };
}

function syncUniforms(): void {
	if (!updateParticles || !deposit || !diffuseAndDecay || !render) {
		return;
	}
	updateParticles.setUniform('u_sensorAngle', (get(sensorAngle) * Math.PI) / 180);
	updateParticles.setUniform('u_sensorDistance', get(sensorDistance));
	updateParticles.setUniform('u_rotationAngle', (get(rotationAngle) * Math.PI) / 180);
	updateParticles.setUniform('u_stepSize', get(stepSize));
	deposit.setUniform('u_value', get(depositAmount));
	diffuseAndDecay.setUniform('u_decayFactor', get(decayFactor));
	render.setUniform('u_scale', get(renderAmplitude));
}

function reset(): void {
	if (!particlesPositions || !particlesHeading || !trail) {
		return;
	}
	const canvas = get(canvasRef);
	if (!canvas) {
		return;
	}

	syncUniforms();
	trail.clear();

	const { positions, heading, numParticles } = initParticlesArrays();
	particlesPositions.resize(numParticles, positions);
	particlesHeading.resize(numParticles, heading);

	if (diffuseAndDecay) {
		diffuseAndDecay.setUniform('u_pxSize', [1 / canvas.width, 1 / canvas.height]);
	}
	if (updateParticles) {
		updateParticles.setUniform('u_dimensions', [canvas.width, canvas.height]);
	}
}

const lastDrawPos = ref<[number, number] | null>(null);
const PAINT_DIAMETER = 25;

function onPointerDown(e: PointerEvent): void {
	const composer = get(composerRef);
	if (!composer || !deposit || !trail) {
		return;
	}
	const canvas = get(canvasRef);
	if (!canvas) {
		return;
	}
	const pos: [number, number] = [e.offsetX, canvas.height - e.offsetY];
	composer.stepCircle({
		program: deposit,
		input: trail,
		output: trail,
		position: pos,
		diameter: PAINT_DIAMETER
	});
	lastDrawPos.value = pos;
}

function onPointerMove(e: PointerEvent): void {
	const composer = get(composerRef);
	if (!composer || !deposit || !trail || !get(lastDrawPos)) {
		return;
	}
	const canvas = get(canvasRef);
	if (!canvas) {
		return;
	}
	const pos: [number, number] = [e.offsetX, canvas.height - e.offsetY];
	composer.stepSegment({
		program: deposit,
		input: trail,
		output: trail,
		position1: pos,
		position2: get(lastDrawPos)!,
		thickness: PAINT_DIAMETER,
		endCaps: true
	});
	lastDrawPos.value = pos;
}

function onPointerUp(): void {
	lastDrawPos.value = null;
}

function loop(): void {
	const composer = get(composerRef);
	if (
		!composer ||
		!updateParticles ||
		!particlesHeading ||
		!particlesPositions ||
		!trail ||
		!deposit ||
		!diffuseAndDecay ||
		!render
	) {
		return;
	}

	updateParticles.setUniform('u_randomDir', Math.random() < 0.5);

	composer.step({
		program: updateParticles,
		input: [particlesHeading, particlesPositions, trail],
		output: [particlesHeading, particlesPositions]
	});

	composer.drawLayerAsPoints({
		layer: particlesPositions,
		program: deposit,
		input: trail,
		output: trail,
		pointSize: 1,
		wrapX: true,
		wrapY: true
	});

	composer.step({
		program: diffuseAndDecay,
		input: trail,
		output: trail
	});

	composer.step({
		program: render,
		input: trail
	});
}

watch(sensorAngle, () => {
	updateParticles?.setUniform('u_sensorAngle', (get(sensorAngle) * Math.PI) / 180);
});
watch(sensorDistance, () => {
	updateParticles?.setUniform('u_sensorDistance', get(sensorDistance));
});
watch(rotationAngle, () => {
	updateParticles?.setUniform('u_rotationAngle', (get(rotationAngle) * Math.PI) / 180);
});
watch(stepSize, () => {
	updateParticles?.setUniform('u_stepSize', get(stepSize));
});
watch(depositAmount, () => {
	deposit?.setUniform('u_value', get(depositAmount));
});
watch(decayFactor, () => {
	diffuseAndDecay?.setUniform('u_decayFactor', get(decayFactor));
});
watch(renderAmplitude, () => {
	render?.setUniform('u_scale', get(renderAmplitude));
});

const stopComposerWatch = watch(
	() => get(composerRef),
	async (c) => {
		if (c && !trail) {
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

	const { positions, heading, numParticles } = initParticlesArrays();

	particlesPositions = new GPULayer(composer, {
		name: 'particlesPositions',
		dimensions: numParticles,
		numComponents: PARTICLES_NUM_COMPONENTS,
		type: FLOAT,
		numBuffers: 2,
		array: positions
	});

	particlesHeading = new GPULayer(composer, {
		name: 'particlesHeading',
		dimensions: numParticles,
		numComponents: 1,
		type: FLOAT,
		numBuffers: 2,
		array: heading
	});

	updateParticles = new GPUProgram(composer, {
		name: 'updateParticles',
		fragmentShader: `
			in vec2 v_uv;

			#define TWO_PI 6.28318530718

			uniform sampler2D u_particlesHeading;
			uniform sampler2D u_particlesPositions;
			uniform sampler2D u_trail;
			uniform vec2 u_dimensions;
			uniform float u_sensorAngle;
			uniform float u_sensorDistance;
			uniform float u_rotationAngle;
			uniform bool u_randomDir;
			uniform float u_stepSize;

			layout (location = 0) out float out_heading;
			layout (location = 1) out vec4 out_position;

			float sense(vec2 position, float angle) {
				vec2 sensePosition = position + u_sensorDistance * vec2(cos(angle), sin(angle));
				return texture(u_trail, sensePosition / u_dimensions).x;
			}

			void main() {
				float heading = texture(u_particlesHeading, v_uv).r;

				vec4 positionInfo = texture(u_particlesPositions, v_uv);
				vec2 absolute = positionInfo.xy;
				vec2 displacement = positionInfo.zw;
				vec2 position = absolute + displacement;

				float middleState = sense(position, heading);
				float leftState = sense(position, heading + u_sensorAngle);
				float rightState = sense(position, heading - u_sensorAngle);
				float rightWeight = step(middleState, rightState);
				float leftWeight = step(middleState, leftState);
				heading += mix(
					rightWeight * mix(u_rotationAngle, -u_rotationAngle, float(u_randomDir)),
					mix(u_rotationAngle, -u_rotationAngle, rightWeight),
					abs(leftWeight - rightWeight)
				);

				heading = mod(heading + TWO_PI, TWO_PI);
				out_heading = heading;

				vec2 move = u_stepSize * vec2(cos(heading), sin(heading));
				vec2 nextDisplacement = displacement + move;

				float shouldMerge = step(30.0, dot(nextDisplacement, nextDisplacement));
				absolute = mod(absolute + shouldMerge * nextDisplacement + u_dimensions, u_dimensions);
				nextDisplacement *= (1.0 - shouldMerge);

				out_position = vec4(absolute, nextDisplacement);
			}`,
		uniforms: [
			{ name: 'u_particlesHeading', value: 0, type: INT },
			{ name: 'u_particlesPositions', value: 1, type: INT },
			{ name: 'u_trail', value: 2, type: INT },
			{ name: 'u_dimensions', value: [canvas.width, canvas.height], type: FLOAT },
			{ name: 'u_sensorAngle', value: (get(sensorAngle) * Math.PI) / 180, type: FLOAT },
			{ name: 'u_sensorDistance', value: get(sensorDistance), type: FLOAT },
			{ name: 'u_rotationAngle', value: (get(rotationAngle) * Math.PI) / 180, type: FLOAT },
			{ name: 'u_randomDir', value: false, type: BOOL },
			{ name: 'u_stepSize', value: get(stepSize), type: FLOAT }
		]
	});

	trail = new GPULayer(composer, {
		name: 'trail',
		dimensions: [canvas.width, canvas.height],
		numComponents: 1,
		type: FLOAT,
		filter: LINEAR,
		numBuffers: 2,
		wrapX: REPEAT,
		wrapY: REPEAT
	});

	deposit = addValueProgram(composer, {
		name: 'deposit',
		type: trail.type,
		value: get(depositAmount)
	});

	diffuseAndDecay = new GPUProgram(composer, {
		name: 'diffuseAndDecay',
		fragmentShader: `
			in vec2 v_uv;

			uniform sampler2D u_trail;
			uniform float u_decayFactor;
			uniform vec2 u_pxSize;

			out float out_state;

			void main() {
				vec2 halfPx = u_pxSize / 2.0;
				float prevStateNE = texture(u_trail, v_uv + halfPx).x;
				float prevStateNW = texture(u_trail, v_uv + vec2(-halfPx.x, halfPx.y)).x;
				float prevStateSE = texture(u_trail, v_uv + vec2(halfPx.x, -halfPx.y)).x;
				float prevStateSW = texture(u_trail, v_uv - halfPx).x;
				float diffusedState = (prevStateNE + prevStateNW + prevStateSE + prevStateSW) / 4.0;
				out_state = u_decayFactor * diffusedState;
			}`,
		uniforms: [
			{ name: 'u_trail', value: 0, type: INT },
			{ name: 'u_decayFactor', value: get(decayFactor), type: FLOAT },
			{ name: 'u_pxSize', value: [1 / canvas.width, 1 / canvas.height], type: FLOAT }
		]
	});

	render = renderAmplitudeProgram(composer, {
		name: 'render',
		type: trail.type,
		components: 'x',
		scale: get(renderAmplitude)
	});

	registerLoop(loop);

	onResize(() => {
		if (!particlesPositions || !particlesHeading || !trail) {
			return;
		}
		const cvs = get(canvasRef);
		if (!cvs) {
			return;
		}

		const arrs = initParticlesArrays();
		particlesPositions.resize(arrs.numParticles, arrs.positions);
		particlesHeading.resize(arrs.numParticles, arrs.heading);

		trail.resize([cvs.width, cvs.height]);

		if (diffuseAndDecay) {
			diffuseAndDecay.setUniform('u_pxSize', [1 / cvs.width, 1 / cvs.height]);
		}
		if (updateParticles) {
			updateParticles.setUniform('u_dimensions', [cvs.width, cvs.height]);
		}
	});

	gpuioActions.applyPreset = applyPreset;

	const pending = get(pendingPreset);
	if (pending) {
		pendingPreset.value = null;
		applyPreset(pending);
	}
}

const presets: Record<
	string,
	{
		decayFactor: number;
		depositAmount: number;
		particleDensity: number;
		sensorDistance: number;
		sensorAngle: number;
		stepSize: number;
		rotationAngle: number;
		renderAmplitude: number;
	}
> = {
	Fibers: {
		decayFactor: 0.9,
		depositAmount: 4,
		particleDensity: 0.35,
		sensorDistance: 18,
		sensorAngle: 5.5,
		stepSize: 2,
		rotationAngle: 45,
		renderAmplitude: 0.03
	},
	Fingerprint: {
		decayFactor: 0.9,
		depositAmount: 4,
		particleDensity: 0.35,
		sensorDistance: 14,
		sensorAngle: 70,
		stepSize: 1.5,
		rotationAngle: -25,
		renderAmplitude: 0.03
	},
	Honeycomb: {
		decayFactor: 0.9,
		depositAmount: 4,
		particleDensity: 0.35,
		sensorDistance: 7.5,
		sensorAngle: 90,
		stepSize: 2,
		rotationAngle: -45,
		renderAmplitude: 0.03
	},
	Net: {
		decayFactor: 0.9,
		depositAmount: 4,
		particleDensity: 0.35,
		sensorDistance: 18,
		sensorAngle: 90,
		stepSize: 2,
		rotationAngle: -16,
		renderAmplitude: 0.03
	},
	Dots: {
		decayFactor: 0.9,
		depositAmount: 4,
		particleDensity: 0.35,
		sensorDistance: 26,
		sensorAngle: 5.5,
		stepSize: 1.5,
		rotationAngle: -70,
		renderAmplitude: 0.03
	}
};

function applyPreset(name: string): void {
	const settings = presets[name];
	if (!settings) {
		return;
	}
	decayFactor.value = settings.decayFactor;
	depositAmount.value = settings.depositAmount;
	particleDensity.value = settings.particleDensity;
	sensorDistance.value = settings.sensorDistance;
	sensorAngle.value = settings.sensorAngle;
	stepSize.value = settings.stepSize;
	rotationAngle.value = settings.rotationAngle;
	renderAmplitude.value = settings.renderAmplitude;
	if (!particlesPositions || !particlesHeading || !trail) {
		return;
	}
	const canvas = get(canvasRef);
	if (!canvas) {
		return;
	}

	syncUniforms();
	trail.clear();

	const { positions, heading, numParticles } = initParticlesArrays();
	particlesPositions.resize(numParticles, positions);
	particlesHeading.resize(numParticles, heading);

	if (diffuseAndDecay) {
		diffuseAndDecay.setUniform('u_pxSize', [1 / canvas.width, 1 / canvas.height]);
	}
	if (updateParticles) {
		updateParticles.setUniform('u_dimensions', [canvas.width, canvas.height]);
	}
}

useEventListener(canvasRef, 'pointerdown', onPointerDown);
useEventListener(canvasRef, 'pointermove', onPointerMove);
useEventListener(canvasRef, 'pointerup', onPointerUp);
useEventListener(canvasRef, 'pointerleave', onPointerUp);

onBeforeUnmount(() => {
	stopComposerWatch();
	unregisterLoop();

	gpuioActions.applyPreset = undefined;

	particlesPositions?.dispose();
	particlesHeading?.dispose();
	trail?.dispose();
	updateParticles?.dispose();
	deposit?.dispose();
	diffuseAndDecay?.dispose();
	render?.dispose();

	particlesPositions = null;
	particlesHeading = null;
	trail = null;
	updateParticles = null;
	deposit = null;
	diffuseAndDecay = null;
	render = null;
});

function fractionForParam(value: number, min: number, max: number): number {
	return (value - min) / (max - min);
}

const particleCount = computed(() => {
	const canvas = get(canvasRef);
	if (!canvas) {
		return 0;
	}
	return Math.round(canvas.width * canvas.height * get(particleDensity));
});
</script>

<template>
	<div v-if="composerRef" class="root">
		<div v-if="showControls" class="controls">
			<button class="hide-btn" @click="showControls = false">✕</button>
			<div class="scroll">
				<div class="control-section">
					<div class="section-header">Particles</div>
					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`Sensor Angle: ${sensorAngle.toFixed(1)}°`"
							:min="0"
							:max="180"
							:thumb-position="fractionForParam(sensorAngle, 0, 180)"
							:thumb-size="0.02"
							@drag="(v: number) => (sensorAngle = v)"
							@decrement="sensorAngle = Math.max(0, sensorAngle - 1)"
							@increment="sensorAngle = Math.min(180, sensorAngle + 1)" />
					</div>

					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`Sensor Distance: ${sensorDistance.toFixed(1)}`"
							:min="1"
							:max="30"
							:thumb-position="fractionForParam(sensorDistance, 1, 30)"
							:thumb-size="0.02"
							@drag="(v: number) => (sensorDistance = v)"
							@decrement="sensorDistance = Math.max(1, sensorDistance - 0.5)"
							@increment="sensorDistance = Math.min(30, sensorDistance + 0.5)" />
					</div>

					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`Rotation Angle: ${rotationAngle.toFixed(1)}°`"
							:min="-90"
							:max="90"
							:thumb-position="fractionForParam(rotationAngle, -90, 90)"
							:thumb-size="0.02"
							@drag="(v: number) => (rotationAngle = v)"
							@decrement="rotationAngle = Math.max(-90, rotationAngle - 1)"
							@increment="rotationAngle = Math.min(90, rotationAngle + 1)" />
					</div>

					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`Step Size: ${stepSize.toFixed(2)}`"
							:min="0.01"
							:max="3"
							:thumb-position="fractionForParam(stepSize, 0.01, 3)"
							:thumb-size="0.02"
							@drag="(v: number) => (stepSize = v)"
							@decrement="stepSize = Math.max(0.01, stepSize - 0.05)"
							@increment="stepSize = Math.min(3, stepSize + 0.05)" />
					</div>

					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`Particle Density: ${particleDensity.toFixed(2)} (${particleCount.toLocaleString('en-US')} particles)`"
							:min="0.01"
							:max="1"
							:thumb-position="fractionForParam(particleDensity, 0.01, 1)"
							:thumb-size="0.02"
							@drag="(v: number) => (particleDensity = v)"
							@drag-end="reset()"
							@decrement="particleDensity = Math.max(0.01, particleDensity - 0.05)"
							@increment="particleDensity = Math.min(1, particleDensity + 0.05)" />
					</div>
				</div>

				<div class="control-section">
					<div class="section-header">Trails</div>
					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`Deposit Amount: ${depositAmount.toFixed(1)}`"
							:min="0"
							:max="10"
							:thumb-position="fractionForParam(depositAmount, 0, 10)"
							:thumb-size="0.02"
							@drag="(v: number) => (depositAmount = v)"
							@decrement="depositAmount = Math.max(0, depositAmount - 0.25)"
							@increment="depositAmount = Math.min(10, depositAmount + 0.25)" />
					</div>

					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`Decay Factor: ${decayFactor.toFixed(2)}`"
							:min="0"
							:max="1"
							:thumb-position="fractionForParam(decayFactor, 0, 1)"
							:thumb-size="0.02"
							@drag="(v: number) => (decayFactor = v)"
							@decrement="decayFactor = Math.max(0, decayFactor - 0.01)"
							@increment="decayFactor = Math.min(1, decayFactor + 0.01)" />
					</div>
				</div>

				<div class="control-section">
					<div class="section-header">Render</div>
					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`Render Amplitude: ${renderAmplitude.toFixed(2)}`"
							:min="0"
							:max="1"
							:thumb-position="fractionForParam(renderAmplitude, 0, 1)"
							:thumb-size="0.02"
							@drag="(v: number) => (renderAmplitude = v)"
							@decrement="renderAmplitude = Math.max(0, renderAmplitude - 0.01)"
							@increment="renderAmplitude = Math.min(1, renderAmplitude + 0.01)" />
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
		width: 280px;
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

		& .scroll {
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
