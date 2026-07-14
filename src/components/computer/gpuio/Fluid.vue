<script setup lang="ts">
import { Scrollbar } from '@os-gui';
import { useGpuIO } from '@composables/useGpuIO';
import { get, useMouseInElement } from '@vueuse/core';
import { inject, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { FLOAT, GPULayer, GPUProgram, INT, LINEAR, NEAREST, renderSignedAmplitudeProgram, REPEAT, SHORT } from 'gpu-io';
import type { Ref } from 'vue';

const { composer: composerRef, canvas: canvasRef, registerLoop, unregisterLoop, onResize } = useGpuIO();
const gpuioActions = inject<{ reset?: () => void; applyPreset?: (name: string) => void }>('gpuio-actions', {});
const showControls = inject<Ref<boolean>>('gpuio-showControls', ref(true));
const pendingPreset = inject<Ref<string | null>>('gpuio-pendingPreset', ref<string | null>(null));

const trailLength = ref(15);
const renderMode = ref<'Fluid' | 'Pressure' | 'Velocity'>('Fluid');

const TOUCH_FORCE_SCALE = 2;
const PARTICLE_DENSITY = 0.1;
const MAX_NUM_PARTICLES = 100_000;
const PARTICLE_LIFETIME = 1000;
const NUM_JACOBI_STEPS = 3;
const PRESSURE_CALC_ALPHA = -1;
const PRESSURE_CALC_BETA = 0.25;
const NUM_RENDER_STEPS = 3;
const VELOCITY_SCALE_FACTOR = 8;
const MAX_VELOCITY = 30;
const POSITION_NUM_COMPONENTS = 4;

let velocityState: GPULayer | null = null;
let divergenceState: GPULayer | null = null;
let pressureState: GPULayer | null = null;
let particlePositionState: GPULayer | null = null;
let particleInitialState: GPULayer | null = null;
let particleAgeState: GPULayer | null = null;
let trailState: GPULayer | null = null;
let advection: GPUProgram | null = null;
let divergence2D: GPUProgram | null = null;
let jacobi: GPUProgram | null = null;
let gradientSubtraction: GPUProgram | null = null;
let renderParticles: GPUProgram | null = null;
let ageParticles: GPUProgram | null = null;
let advectParticles: GPUProgram | null = null;
let fadeTrails: GPUProgram | null = null;
let renderTrails: GPUProgram | null = null;
let renderPressure: GPUProgram | null = null;
let touchProgram: GPUProgram | null = null;

let numParticles = 0;

function calcNumParticles(w: number, h: number): number {
	return Math.min(Math.ceil(w * h * PARTICLE_DENSITY), MAX_NUM_PARTICLES);
}

function initParticles(): void {
	if (!particlePositionState || !particleInitialState || !particleAgeState) {
		return;
	}
	const canvas = get(canvasRef);
	if (!canvas) {
		return;
	}

	numParticles = calcNumParticles(canvas.width, canvas.height);
	const pos = new Float32Array(numParticles * POSITION_NUM_COMPONENTS);
	const age = new Int16Array(numParticles);
	for (let i = 0; i < numParticles; i++) {
		pos[POSITION_NUM_COMPONENTS * i] = Math.random() * canvas.width;
		pos[POSITION_NUM_COMPONENTS * i + 1] = Math.random() * canvas.height;
		pos[POSITION_NUM_COMPONENTS * i + 2] = 0;
		pos[POSITION_NUM_COMPONENTS * i + 3] = 0;
		age[i] = Math.floor(Math.random() * PARTICLE_LIFETIME);
	}
	particlePositionState.setFromArray(pos);
	particleInitialState.setFromArray(pos);
	particleAgeState.setFromArray(age);
}

const TOUCH_THICKNESS = 30;
const { elementX, elementY, isOutside } = useMouseInElement(canvasRef);
let lastTouchPos: [number, number] | null = null;

function applyTouchForces(): void {
	const composer = get(composerRef);
	if (!composer || !touchProgram || !velocityState || !get(canvasRef)) {
		return;
	}

	if (get(isOutside)) {
		lastTouchPos = null;
		return;
	}

	const canvas = get(canvasRef)!;
	const current: [number, number] = [get(elementX), canvas.height - get(elementY)];

	if (lastTouchPos && (lastTouchPos[0] !== current[0] || lastTouchPos[1] !== current[1])) {
		const dx = current[0] - lastTouchPos[0];
		const dy = current[1] - lastTouchPos[1];
		touchProgram.setUniform('u_vector', [dx, dy]);
		composer.stepSegment({
			program: touchProgram,
			input: velocityState,
			output: velocityState,
			position1: current,
			position2: lastTouchPos,
			thickness: TOUCH_THICKNESS,
			endCaps: true
		});
	}
	lastTouchPos = current;
}

function loop(): void {
	const composer = get(composerRef);
	if (
		!composer ||
		!velocityState ||
		!advection ||
		!divergence2D ||
		!jacobi ||
		!gradientSubtraction ||
		!pressureState ||
		!divergenceState ||
		!ageParticles ||
		!particleAgeState ||
		!advectParticles ||
		!particlePositionState ||
		!particleInitialState ||
		!fadeTrails ||
		!trailState ||
		!renderParticles ||
		!renderPressure ||
		!renderTrails
	) {
		return;
	}

	composer.step({ program: advection, input: [velocityState, velocityState], output: velocityState });
	composer.step({ program: divergence2D, input: velocityState, output: divergenceState });
	for (let i = 0; i < NUM_JACOBI_STEPS; i++) {
		composer.step({ program: jacobi, input: [pressureState, divergenceState], output: pressureState });
	}
	composer.step({ program: gradientSubtraction, input: [pressureState, velocityState], output: velocityState });

	if (get(renderMode) === 'Pressure') {
		composer.step({ program: renderPressure, input: pressureState });
	} else if (get(renderMode) === 'Velocity') {
		composer.step({ program: renderTrails, input: trailState });
		composer.drawLayerAsVectorField({
			layer: velocityState,
			vectorSpacing: 10,
			vectorScale: 2.5,
			color: [0, 0, 0]
		});
	} else {
		composer.step({ program: ageParticles, input: particleAgeState, output: particleAgeState });
		composer.step({ program: fadeTrails, input: trailState, output: trailState });
		for (let i = 0; i < NUM_RENDER_STEPS; i++) {
			composer.step({
				program: advectParticles,
				input: [particlePositionState, velocityState, particleAgeState, particleInitialState],
				output: particlePositionState
			});
			composer.drawLayerAsPoints({
				layer: particlePositionState,
				program: renderParticles,
				input: [particleAgeState, velocityState],
				output: trailState,
				wrapX: true,
				wrapY: true
			});
		}
		composer.step({ program: renderTrails, input: trailState });
	}

	applyTouchForces();
}

watch(trailLength, () => {
	fadeTrails?.setUniform('u_increment', -1 / get(trailLength));
});

const presets: Record<string, { tl: number; rm: 'Fluid' | 'Pressure' | 'Velocity' }> = {
	'Default': { tl: 15, rm: 'Fluid' },
	'Long Trails': { tl: 50, rm: 'Fluid' },
	'Pressure View': { tl: 15, rm: 'Pressure' }
};

function applyPreset(name: string): void {
	const p = presets[name];
	if (!p) {
		return;
	}
	trailLength.value = p.tl;
	renderMode.value = p.rm;
	initParticles();
}

const stopComposerWatch = watch(
	() => get(composerRef),
	async (c) => {
		if (c && !velocityState) {
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

	const w = Math.ceil(canvas.width / VELOCITY_SCALE_FACTOR);
	const h = Math.ceil(canvas.height / VELOCITY_SCALE_FACTOR);
	numParticles = calcNumParticles(canvas.width, canvas.height);

	velocityState = new GPULayer(composer, {
		name: 'velocity',
		dimensions: [w, h],
		type: FLOAT,
		filter: LINEAR,
		numComponents: 2,
		wrapX: REPEAT,
		wrapY: REPEAT,
		numBuffers: 2
	});
	divergenceState = new GPULayer(composer, {
		name: 'divergence',
		dimensions: [w, h],
		type: FLOAT,
		filter: NEAREST,
		numComponents: 1,
		wrapX: REPEAT,
		wrapY: REPEAT
	});
	pressureState = new GPULayer(composer, {
		name: 'pressure',
		dimensions: [w, h],
		type: FLOAT,
		filter: NEAREST,
		numComponents: 1,
		wrapX: REPEAT,
		wrapY: REPEAT,
		numBuffers: 2
	});
	particlePositionState = new GPULayer(composer, {
		name: 'position',
		dimensions: numParticles,
		type: FLOAT,
		numComponents: POSITION_NUM_COMPONENTS,
		numBuffers: 2
	});
	particleInitialState = new GPULayer(composer, {
		name: 'initialPosition',
		dimensions: numParticles,
		type: FLOAT,
		numComponents: POSITION_NUM_COMPONENTS,
		numBuffers: 1
	});
	particleAgeState = new GPULayer(composer, {
		name: 'age',
		dimensions: numParticles,
		type: SHORT,
		numComponents: 1,
		numBuffers: 2
	});
	trailState = new GPULayer(composer, {
		name: 'trails',
		dimensions: [canvas.width, canvas.height],
		type: FLOAT,
		filter: NEAREST,
		numComponents: 1,
		numBuffers: 2
	});

	advection = new GPUProgram(composer, {
		name: 'advection',
		fragmentShader: `
			in vec2 v_uv; uniform sampler2D u_state; uniform sampler2D u_velocity; uniform vec2 u_dimensions; out vec2 out_state;
			void main() { out_state = texture(u_state, v_uv - texture(u_velocity, v_uv).xy / u_dimensions).xy; }`,
		uniforms: [
			{ name: 'u_state', value: 0, type: INT },
			{ name: 'u_velocity', value: 1, type: INT },
			{ name: 'u_dimensions', value: [canvas.width, canvas.height], type: FLOAT }
		]
	});
	divergence2D = new GPUProgram(composer, {
		name: 'divergence2D',
		fragmentShader: `
			in vec2 v_uv; uniform sampler2D u_vectorField; uniform vec2 u_pxSize; out float out_divergence;
			void main() { float n = texture(u_vectorField, v_uv + vec2(0,u_pxSize.y)).y; float s = texture(u_vectorField, v_uv - vec2(0,u_pxSize.y)).y; float e = texture(u_vectorField, v_uv + vec2(u_pxSize.x,0)).x; float w = texture(u_vectorField, v_uv - vec2(u_pxSize.x,0)).x; out_divergence = 0.5*(e-w+n-s); }`,
		uniforms: [
			{ name: 'u_vectorField', value: 0, type: INT },
			{ name: 'u_pxSize', value: [1 / w, 1 / h], type: FLOAT }
		]
	});
	jacobi = new GPUProgram(composer, {
		name: 'jacobi',
		fragmentShader: `
			in vec2 v_uv; uniform float u_alpha; uniform float u_beta; uniform vec2 u_pxSize; uniform sampler2D u_previousState; uniform sampler2D u_divergence; out vec4 out_jacobi;
			void main() { vec4 n = texture(u_previousState, v_uv+vec2(0,u_pxSize.y)); vec4 s = texture(u_previousState, v_uv-vec2(0,u_pxSize.y)); vec4 e = texture(u_previousState, v_uv+vec2(u_pxSize.x,0)); vec4 w = texture(u_previousState, v_uv-vec2(u_pxSize.x,0)); vec4 d = texture(u_divergence, v_uv); out_jacobi = (n+s+e+w+u_alpha*d)*u_beta; }`,
		uniforms: [
			{ name: 'u_alpha', value: PRESSURE_CALC_ALPHA, type: FLOAT },
			{ name: 'u_beta', value: PRESSURE_CALC_BETA, type: FLOAT },
			{ name: 'u_pxSize', value: [1 / w, 1 / h], type: FLOAT },
			{ name: 'u_previousState', value: 0, type: INT },
			{ name: 'u_divergence', value: 1, type: INT }
		]
	});
	gradientSubtraction = new GPUProgram(composer, {
		name: 'gradientSubtraction',
		fragmentShader: `
			in vec2 v_uv; uniform vec2 u_pxSize; uniform sampler2D u_scalarField; uniform sampler2D u_vectorField; out vec2 out_result;
			void main() { float n = texture(u_scalarField, v_uv+vec2(0,u_pxSize.y)).r; float s = texture(u_scalarField, v_uv-vec2(0,u_pxSize.y)).r; float e = texture(u_scalarField, v_uv+vec2(u_pxSize.x,0)).r; float w = texture(u_scalarField, v_uv-vec2(u_pxSize.x,0)).r; out_result = texture(u_vectorField, v_uv).xy - 0.5*vec2(e-w,n-s); }`,
		uniforms: [
			{ name: 'u_pxSize', value: [1 / w, 1 / h], type: FLOAT },
			{ name: 'u_scalarField', value: 0, type: INT },
			{ name: 'u_vectorField', value: 1, type: INT }
		]
	});
	renderParticles = new GPUProgram(composer, {
		name: 'renderParticles',
		fragmentShader: `
			in vec2 v_uv; in vec2 v_uv_position; uniform isampler2D u_ages; uniform sampler2D u_velocity; out float out_state;
			void main() { float ageFraction = float(texture(u_ages, v_uv_position).x) / ${PARTICLE_LIFETIME.toFixed(1)}; float opacity = mix(0.0,1.0,min(ageFraction*10.0,1.0))*mix(1.0,0.0,max(ageFraction*10.0-90.0,0.0)); vec2 velocity = texture(u_velocity, v_uv).xy; float multiplier = clamp(dot(velocity,velocity)*0.05+0.7,0.0,1.0); out_state = opacity*multiplier; }`,
		uniforms: [
			{ name: 'u_ages', value: 0, type: INT },
			{ name: 'u_velocity', value: 1, type: INT }
		]
	});
	ageParticles = new GPUProgram(composer, {
		name: 'ageParticles',
		fragmentShader: `
			in vec2 v_uv; uniform isampler2D u_ages; out int out_age;
			void main() { int age = texture(u_ages, v_uv).x + 1; out_age = stepi(age, ${PARTICLE_LIFETIME}) * age; }`,
		uniforms: [{ name: 'u_ages', value: 0, type: INT }]
	});
	advectParticles = new GPUProgram(composer, {
		name: 'advectParticles',
		fragmentShader: `
			in vec2 v_uv; uniform vec2 u_dimensions; uniform sampler2D u_positions; uniform sampler2D u_velocity; uniform isampler2D u_ages; uniform sampler2D u_initialPositions; out vec4 out_position;
			void main() { vec4 positionData = texture(u_positions, v_uv); vec2 absolute = positionData.rg; vec2 displacement = positionData.ba; vec2 position = absolute+displacement; vec2 pxSize = 1.0/u_dimensions; vec2 velocity1 = texture(u_velocity, position*pxSize).xy; vec2 halfStep = position+velocity1*0.5*${1 / NUM_RENDER_STEPS}; vec2 velocity2 = texture(u_velocity, halfStep*pxSize).xy; displacement += velocity2*${1 / NUM_RENDER_STEPS}; float shouldMerge = step(20.0, dot(displacement,displacement)); absolute = mod(absolute+shouldMerge*displacement+u_dimensions, u_dimensions); displacement *= (1.0-shouldMerge); int shouldReset = stepi(texture(u_ages, v_uv).x, 1); out_position = mix(vec4(absolute,displacement), texture(u_initialPositions, v_uv), float(shouldReset)); }`,
		uniforms: [
			{ name: 'u_positions', value: 0, type: INT },
			{ name: 'u_velocity', value: 1, type: INT },
			{ name: 'u_ages', value: 2, type: INT },
			{ name: 'u_initialPositions', value: 3, type: INT },
			{ name: 'u_dimensions', value: [canvas.width, canvas.height], type: FLOAT }
		]
	});
	fadeTrails = new GPUProgram(composer, {
		name: 'fadeTrails',
		fragmentShader: `
			in vec2 v_uv; uniform sampler2D u_image; uniform float u_increment; out float out_color;
			void main() { out_color = max(texture(u_image, v_uv).x + u_increment, 0.0); }`,
		uniforms: [
			{ name: 'u_image', value: 0, type: INT },
			{ name: 'u_increment', value: -1 / get(trailLength), type: FLOAT }
		]
	});
	renderTrails = new GPUProgram(composer, {
		name: 'renderTrails',
		fragmentShader: `
			in vec2 v_uv; uniform sampler2D u_trailState; out vec4 out_color;
			void main() { vec3 background = vec3(0.98, 0.922, 0.843); vec3 particle = vec3(0.0, 0.0, 0.2); out_color = vec4(mix(background, particle, texture(u_trailState, v_uv).x), 1.0); }`,
		uniforms: [{ name: 'u_trailState', value: 0, type: INT }]
	});
	renderPressure = renderSignedAmplitudeProgram(composer, {
		name: 'renderPressure',
		type: pressureState.type,
		scale: 0.5,
		component: 'x'
	});
	touchProgram = new GPUProgram(composer, {
		name: 'touch',
		fragmentShader: `
			in vec2 v_uv;
			in vec2 v_uv_local;

			uniform sampler2D u_velocity;
			uniform vec2 u_vector;

			out vec2 out_velocity;

			void main() {
				vec2 radialVec = (v_uv_local * 2.0 - 1.0);
				float radiusSq = dot(radialVec, radialVec);
				vec2 velocity = texture(u_velocity, v_uv).xy + (1.0 - radiusSq) * u_vector * ${TOUCH_FORCE_SCALE.toFixed(1)};
				float velocityMag = length(velocity);
				out_velocity = velocity / velocityMag * min(velocityMag, ${MAX_VELOCITY.toFixed(1)});
			}`,
		uniforms: [
			{ name: 'u_velocity', value: 0, type: INT },
			{ name: 'u_vector', value: [0, 0], type: FLOAT }
		]
	});

	initParticles();
	registerLoop(loop);
	onResize(() => {
		if (!velocityState) {
			return;
		}
		const cvs = get(canvasRef);
		if (!cvs) {
			return;
		}
		const vw = Math.ceil(cvs.width / VELOCITY_SCALE_FACTOR);
		const vh = Math.ceil(cvs.height / VELOCITY_SCALE_FACTOR);

		velocityState.resize([vw, vh]);
		divergenceState?.resize([vw, vh]);
		pressureState?.resize([vw, vh]);
		trailState?.resize([cvs.width, cvs.height]);

		advection?.setUniform('u_dimensions', [cvs.width, cvs.height]);
		divergence2D?.setUniform('u_pxSize', [1 / vw, 1 / vh]);
		jacobi?.setUniform('u_pxSize', [1 / vw, 1 / vh]);
		gradientSubtraction?.setUniform('u_pxSize', [1 / vw, 1 / vh]);
		advectParticles?.setUniform('u_dimensions', [cvs.width, cvs.height]);

		numParticles = calcNumParticles(cvs.width, cvs.height);
		particlePositionState?.resize(numParticles);
		particleInitialState?.resize(numParticles);
		particleAgeState?.resize(numParticles);
		initParticles();
	});

	gpuioActions.applyPreset = applyPreset;

	const pending = get(pendingPreset);
	if (pending) {
		pendingPreset.value = null;
		applyPreset(pending);
	}
}

onBeforeUnmount(() => {
	stopComposerWatch();
	unregisterLoop();
	gpuioActions.applyPreset = undefined;
	velocityState?.dispose();
	divergenceState?.dispose();
	pressureState?.dispose();
	particlePositionState?.dispose();
	particleInitialState?.dispose();
	particleAgeState?.dispose();
	trailState?.dispose();
	advection?.dispose();
	divergence2D?.dispose();
	jacobi?.dispose();
	gradientSubtraction?.dispose();
	renderParticles?.dispose();
	ageParticles?.dispose();
	advectParticles?.dispose();
	fadeTrails?.dispose();
	renderTrails?.dispose();
	renderPressure?.dispose();
	touchProgram?.dispose();
	velocityState = null;
	divergenceState = null;
	pressureState = null;
	particlePositionState = null;
	particleInitialState = null;
	particleAgeState = null;
	trailState = null;
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
					<div class="section-header">Trails</div>
					<div class="control-row">
						<Scrollbar
							orientation="horizontal"
							:label="`Trail Length: ${trailLength}`"
							:min="0"
							:max="100"
							:thumb-position="fractionForParam(trailLength, 0, 100)"
							:thumb-size="0.02"
							@drag="(v: number) => (trailLength = Math.round(v))" />
					</div>
				</div>
				<div class="control-section">
					<div class="section-header">Render</div>
					<div class="control-row toggle-row">
						<button
							:class="['toggle-btn', { active: renderMode === 'Fluid' }]"
							@click="renderMode = 'Fluid'">
							Fluid
						</button>
						<button
							:class="['toggle-btn', { active: renderMode === 'Pressure' }]"
							@click="renderMode = 'Pressure'">
							Pressure
						</button>
						<button
							:class="['toggle-btn', { active: renderMode === 'Velocity' }]"
							@click="renderMode = 'Velocity'">
							Velocity
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
