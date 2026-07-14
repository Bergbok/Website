<script setup lang="ts">
import { get } from '@vueuse/core';
import { computed, ref, useTemplateRef } from 'vue';

const {
	orientation = 'vertical',
	thumbPosition = 0,
	thumbSize = 0.1,
	showTrack = true,
	decrementDisabled = false,
	incrementDisabled = false,
	label,
	min,
	max
} = defineProps<{
	/** axis of the scrollbar */
	orientation?: 'vertical' | 'horizontal';
	/** 0–1 fraction: how far down/right the thumb is */
	thumbPosition?: number;
	/** 0–1 fraction: what portion of the track the thumb occupies */
	thumbSize?: number;
	/** whether to show the track and thumb (set false for button-only) */
	showTrack?: boolean;
	/** disable the decrement (up/left) button */
	decrementDisabled?: boolean;
	/** disable the increment (down/right) button */
	incrementDisabled?: boolean;
	/** optional label displayed next to the scrollbar */
	label?: string;
	/** minimum value (when set, drag/drag-end emit resolved values) */
	min?: number;
	/** maximum value (when set, drag/drag-end emit resolved values) */
	max?: number;
}>();

const emit = defineEmits<{
	/** user clicked the decrement (up/left) button */
	'decrement': [];
	/** user clicked the increment (down/right) button */
	'increment': [];
	/** user clicked in the decrement track area (before thumb) */
	'track-decrement': [];
	/** user clicked in the increment track area (after thumb) */
	'track-increment': [];
	/** thumb is being dragged — resolved value if min/max set, else 0–1 fraction */
	'drag': [value: number];
	/** thumb drag ended — resolved value if min/max set, else 0–1 fraction */
	'drag-end': [value: number];
}>();

const trackRef = useTemplateRef<HTMLElement>('trackRef');
const isDragging = ref(false);

function resolveValue(fraction: number): number {
	if (min !== undefined && max !== undefined) {
		return min + fraction * (max - min);
	}
	return fraction;
}

function fractionFromPointer(e: PointerEvent | MouseEvent): number {
	if (!get(trackRef)) {
		return 0;
	}
	const rect = get(trackRef)!.getBoundingClientRect();
	if (orientation === 'horizontal') {
		return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
	}
	return Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
}

function onThumbPointerDown(e: PointerEvent): void {
	e.stopPropagation();
	e.preventDefault();
	isDragging.value = true;
	(e.target as HTMLElement).setPointerCapture(e.pointerId);
	const fraction = fractionFromPointer(e);
	emit('drag', resolveValue(fraction));
}

function onThumbPointerMove(e: PointerEvent): void {
	if (!get(isDragging)) {
		return;
	}
	const fraction = fractionFromPointer(e);
	emit('drag', resolveValue(fraction));
}

function onThumbPointerUp(e: PointerEvent): void {
	if (!get(isDragging)) {
		return;
	}
	isDragging.value = false;
	(e.target as HTMLElement).releasePointerCapture(e.pointerId);
	const fraction = fractionFromPointer(e);
	emit('drag-end', resolveValue(fraction));
}

function onTrackClick(e: MouseEvent): void {
	const fraction = fractionFromPointer(e);
	emit('drag', resolveValue(fraction));
	if (fraction < thumbPosition) {
		emit('track-decrement');
	} else if (fraction > thumbPosition) {
		emit('track-increment');
	}
}

const thumbStyle = computed(() => {
	const maxOffset = Math.max(0, 1 - thumbSize);
	const offset = thumbPosition * maxOffset;
	if (orientation === 'horizontal') {
		return {
			left: `${offset * 100}%`,
			width: `${thumbSize * 100}%`
		};
	}
	return {
		top: `${offset * 100}%`,
		height: `${thumbSize * 100}%`
	};
});
</script>

<template>
	<div :class="['scrollbar-wrapper', orientation]">
		<span v-if="label" class="scrollbar-label">{{ label }}</span>
		<div :class="['scrollbar', orientation]">
			<div
				:class="['scrollbar-button', 'decrement', orientation, { disabled: decrementDisabled }]"
				@click="!decrementDisabled && emit('decrement')" />
			<template v-if="showTrack">
				<div ref="trackRef" :class="['scrollbar-track', orientation]" @click="onTrackClick">
					<div
						:class="['scrollbar-thumb', orientation]"
						:style="thumbStyle"
						@pointerdown="onThumbPointerDown"
						@pointermove="onThumbPointerMove"
						@pointerup="onThumbPointerUp"
						@pointercancel="onThumbPointerUp" />
				</div>
			</template>
			<div
				:class="['scrollbar-button', 'increment', orientation, { disabled: incrementDisabled }]"
				@click="!incrementDisabled && emit('increment')" />
		</div>
	</div>
</template>

<style scoped>
.scrollbar-wrapper {
	display: flex;
	align-items: center;
	gap: 4px;
	flex: 1;
	min-width: 0;
}
.scrollbar-wrapper.horizontal {
	flex-direction: row;
}
.scrollbar-wrapper.vertical {
	flex-direction: column;
	height: 100%;
}

.scrollbar-label {
	flex-shrink: 0;
	font-size: 11px;
	color: #000;
	white-space: nowrap;
	min-width: 105px;
	text-align: right;
	padding-right: 2px;
	line-height: 13px;
}

.scrollbar {
	display: flex;
	flex: 1;
	min-width: 0;
	min-height: 0;
}
.scrollbar.horizontal {
	flex-direction: row;
	height: 13px;
}
.scrollbar.vertical {
	flex-direction: column;
	width: 13px;
}

.scrollbar.horizontal,
.scrollbar.vertical {
	background: none;
}

.scrollbar-button {
	flex-shrink: 0;
}

.scrollbar-track {
	flex: 1;
	position: relative;
	min-width: 0;
	min-height: 0;
	background: rgba(255, 255, 255, 0.12);
	border: 1px solid rgba(128, 128, 128, 0.25);
	box-sizing: border-box;
}

.scrollbar-track.horizontal {
	height: 13px;
}
.scrollbar-track.vertical {
	width: 13px;
}

.scrollbar-track-piece {
	display: none;
}

.scrollbar-thumb {
	position: absolute;
	cursor: grab;
	touch-action: none;
	user-select: none;
	box-sizing: border-box;
}

.scrollbar-thumb:active {
	cursor: grabbing;
}

.scrollbar-thumb.horizontal {
	top: 0;
	height: 100%;
	min-width: 8px;
}
.scrollbar-thumb.vertical {
	left: 0;
	width: 100%;
	min-height: 8px;
}
</style>
