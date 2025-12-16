<script setup lang="ts">
import 'unfonts.css';
import Color from 'color';
import { ref, computed } from 'vue';
import { iggyCursor } from 'iggy-cursor';
import { ghostCursor } from 'cursor-effects';
import { useFps, useTransition, TransitionPresets } from '@vueuse/core';
import { Shader, CRTScreen, FilmGrain, Pixelate, SolidColor, Swirl } from 'shaders/vue';

const fps = useFps();

const params = {
	h: { value: ref(360), min: 0, max: 360, drift: 20 },
	s: { value: ref(90), min: 70, max: 100, drift: 5 },
	l: { value: ref(45), min: 40, max: 60, drift: 3 },
	coarseX: { value: ref(50), min: 0, max: 100, drift: 15 },
	coarseY: { value: ref(50), min: 0, max: 100, drift: 15 },
	mediumX: { value: ref(50), min: 0, max: 100, drift: 10 },
	mediumY: { value: ref(50), min: 0, max: 100, drift: 10 },
	fineX: { value: ref(50), min: 0, max: 100, drift: 8 },
	fineY: { value: ref(50), min: 0, max: 100, drift: 8 }
};

const duration = 4200;
const transition = TransitionPresets.easeInOutCubic;

const h = useTransition(params.h.value, { duration, transition });
const s = useTransition(params.s.value, { duration, transition });
const l = useTransition(params.l.value, { duration, transition });
const coarseX = useTransition(params.coarseX.value, { duration, transition });
const coarseY = useTransition(params.coarseY.value, { duration, transition });
const mediumX = useTransition(params.mediumX.value, { duration, transition });
const mediumY = useTransition(params.mediumY.value, { duration, transition });
const fineX = useTransition(params.fineX.value, { duration, transition });
const fineY = useTransition(params.fineY.value, { duration, transition });

const color = computed(() => Color.hsl(h.value, s.value, l.value));

// Drift function: adds small random changes to current values
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
const driftToNext = () => {
	Object.entries(params).forEach(([_, config]) => {
		const drift = (Math.random() - 0.5) * 2 * config.drift;
		config.value.value = clamp(config.value.value + drift, config.min, config.max);
	});
};

setInterval(driftToNext, duration);
</script>

<template>
	<Shader class="fullscreen-shader">
		<SolidColor color="#000000" mask-type="alpha" />
		<CRTScreen
			:visible="true"
			:contrast="1.03"
			mask-type="alpha"
			:pixel-size="8"
			:brightness="1.03"
			:color-shift="10"
			:scanline-frequency="500"
			:scanline-intensity="0.05"
		>
			<FilmGrain mask-type="alpha" :strength="0.1">
				<Pixelate :scale="200" mask-type="alpha">
					<Swirl
						:color-a="color.hex()"
						color-b="#00000000"
						:detail="2.5"
						color-space="oklch"
						mask-type="alpha"
						:coarseX="coarseX"
						:coarseY="coarseY"
						:medium-x="mediumX"
						:medium-y="mediumY"
						:fine-x="fineX"
						:fine-y="fineY"
					/>
					<Swirl
						:color-a="color.lighten(0.42).hex()"
						color-b="#00000000"
						:detail="2.5"
						color-space="oklch"
						mask-type="alpha"
						:coarseX="coarseX"
						:coarseY="coarseY"
						:medium-x="mediumX"
						:medium-y="mediumY"
						:fine-x="fineX"
						:fine-y="fineY"
					/>
				</Pixelate>
			</FilmGrain>
		</CRTScreen>
	</Shader>
	<img src="/src/assets/images/404.avif" alt="404" class="centered-404" />
	<p class="fps">{{ fps }}</p>
	<a
		href="https://github.com/Bergbok/Neocity"
		target="_blank"
		rel="noopener noreferrer"
		class="github-link"
	>
		<img src="/src/assets/images/github.svg" alt="GitHub" class="github-svg" />
	</a>
</template>

<script lang="ts">
iggyCursor({ assetsBase: '/iggy/' });
ghostCursor({
	image: 'https://raw.githubusercontent.com/Bergbok/HypnOS-Linux-Cursor/refs/heads/main/src/assets/default.png'
});
</script>

<style scoped>
.centered-404 {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	max-width: 40vw;
	max-height: 40vh;
	z-index: 1;
	pointer-events: none;
}

.fullscreen-shader {
	position: fixed;
	top: 0;
	left: 0;
	width: 100dvw;
	height: 100dvh;
	z-index: -1;
}

.fps {
	position: absolute;
	top: -7rem;
	right: 1rem;
	color: yellow;
	font-family: 'fraps', monospace;
	font-size: 3rem;
	-webkit-text-stroke: 0.1rem black;
}

.github-link {
	position: absolute;
	top: 2rem;
	left: 2rem;
}

.github-svg {
	width: 2.5rem;
	height: 2.5rem;
	display: block;
}
</style>
