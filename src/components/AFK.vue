<script setup lang="ts">
import daxMug from '@assets/images/daxMug.gif';
import omoLurk from '@assets/images/omoLurk.avif';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
	get,
	TransitionPresets,
	useDocumentVisibility,
	useIdle,
	useImage,
	useTimeoutFn,
	useTransition
} from '@vueuse/core';
import type { CubicBezierPoints, EasingFunction } from '@vueuse/core';

const { idle } = useIdle(10_000);

const router = useRouter();

const documentVisibility = useDocumentVisibility();

const { isLoading: daxLoading } = useImage({ src: daxMug }, { immediate: true, delay: 5000 });
const daxRetry = ref(false);
const daxVisibility = ref(false);
const daxTimeout = useTimeoutFn(() => {
	daxVisibility.value = false;
}, 150);

const omoVisibility = ref(0);
const omoDuration = ref(1500);
const omoEasing = ref<EasingFunction | CubicBezierPoints>(TransitionPresets.easeInCubic);

const output = useTransition(omoVisibility, { duration: omoDuration, transition: omoEasing });

watch(idle, (isIdle) => {
	if (isIdle) {
		omoDuration.value = 1500;
		omoEasing.value = TransitionPresets.easeInCubic;
		omoVisibility.value = 1;
	} else {
		omoDuration.value = 200;
		omoEasing.value = TransitionPresets.linear;
		omoVisibility.value = 0;
	}
});

watch(documentVisibility, (current, previous) => {
	if (current === 'visible' && previous === 'hidden') {
		if (Math.random() >= 0.99) {
			if (get(daxRetry) || !get(daxLoading)) {
				daxVisibility.value = true;
				daxRetry.value = false;
			} else {
				daxRetry.value = true;
			}
		}
		daxTimeout.start();
	}
});
</script>

<template>
	<div v-if="daxVisibility" id="daxMug-wrapper">
		<img id="daxMug" :src="daxMug" alt="..." />
	</div>
	<img id="omoLurk" :src="omoLurk" alt="..." @click="router.push('/rickroll')" />
</template>

<style scoped>
#daxMug-wrapper {
	inset: 0;
	overflow: hidden;
	pointer-events: none;
	position: fixed;
	z-index: 2;
}

#daxMug {
	height: 100%;
	object-fit: contain;
	width: 100%;
}

#omoLurk {
	bottom: 0;
	cursor: pointer;
	left: 0;
	pointer-events: auto;
	position: fixed;
	transform: v-bind('`translateY(${(1 - output) * 110}%)`');
	user-select: none;
	z-index: 1;
}
</style>
