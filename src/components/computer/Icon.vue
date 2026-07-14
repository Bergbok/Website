<script setup lang="ts">
import Color from 'color';
import DefaultGraphic from '@assets/images/picmin.avif';
import { get } from '@vueuse/core';
import { computed, useSlots } from 'vue';
import { Neon, Shader } from 'shaders/vue';
import { useSettingsStore } from '@store/settings.ts';
import { useIconSelection } from '@composables/useIconSelection.ts';

const {
	id,
	icon: customIcon,
	keepSelection = false,
	label,
	link,
	shaderOptions
} = defineProps<{
	id: string;
	icon?: string;
	keepSelection?: boolean;
	label: string;
	link?: string;
	shaderOptions?: InstanceType<typeof Neon>['$props'];
}>();

const icon = computed(() => customIcon ?? DefaultGraphic);

const emit = defineEmits<{ open: [] }>();

const slots = useSlots();
const settingsStore = useSettingsStore();

const shadered = computed(
	() =>
		(Boolean(shaderOptions) || Boolean(slots.shader)) &&
		settingsStore.enableNeonIcons &&
		settingsStore.enableShaders
);

const { selected, isSVG, selectedSVG, onClick, onDblClick } = useIconSelection({
	id,
	link,
	keepSelection,
	icon,
	shadered,
	onOpen: () => emit('open')
});

const neonGlowColor = computed(() => {
	if (!shaderOptions?.glowColor) {
		return settingsStore.accentColor;
	}

	if (!get(selected)) {
		return shaderOptions.glowColor;
	}

	return new Color(shaderOptions.glowColor).mix(new Color(settingsStore.accentColor), 0.42).hex();
});
</script>

<template>
	<component
		:is="link ? 'a' : 'div'"
		class="icon"
		:class="{ selected }"
		:href="link"
		:target="link ? '_blank' : undefined"
		:rel="link ? 'noopener' : undefined"
		@click.stop.prevent="onClick($event)"
		@dblclick.stop="onDblClick">
		<div
			class="wrapper"
			:class="{ 'is-svg': isSVG && !shadered, 'is-neon': shadered }"
			:style="{ '--icon-url': `url(${icon})` }">
			<img v-if="!shadered" :src="selectedSVG ?? icon" :alt="label" class="image" draggable="false" />
			<Shader v-else class="image">
				<slot name="shader" :selected="selected">
					<Neon
						:corner-smoothing="0"
						:hot-core-intensity="0"
						:intensity="4"
						:tube-thickness="0"
						secondary-color="#fff"
						:color="shaderOptions?.glowColor"
						v-bind="shaderOptions"
						:glow-color="neonGlowColor"
						:glow-intensity="selected ? 2 : shaderOptions?.glowIntensity" />
				</slot>
			</Shader>
		</div>
		<div v-show="settingsStore.enableIconLabels" class="label">
			<span class="text">{{ label }}</span>
		</div>
	</component>
</template>

<style scoped>
.icon {
	box-sizing: border-box;
	color: inherit;
	display: grid;
	grid-template-rows: 1fr auto;
	row-gap: 8px;
	justify-items: center;
	text-decoration: none;
	height: 100%;
	padding: 4px 0px;
	width: 100%;
	position: relative;

	& .image {
		display: block;
		height: 100%;
		image-rendering: pixelated;
		object-fit: contain;
		width: 100%;
	}

	& .label {
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: clamp(9px, 15cqh, 13px);
		line-height: 1.2;
		min-height: 2lh;
		padding-inline: 0;
		text-align: center;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.85);
		width: 100%;
	}

	& .text {
		display: -webkit-box;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
		overflow-wrap: anywhere;
		max-width: 100%;
	}

	& .wrapper {
		aspect-ratio: 1;
		isolation: isolate;
		overflow: hidden;
		position: relative;
		width: 55%;
		align-self: center;
	}
}

.icon.selected {
	& .image {
		mix-blend-mode: normal;
	}

	& .text {
		background: var(--accent, #000080);
		color: #fff;
		text-shadow: none;
	}

	& .wrapper:not(.is-svg):not(.is-neon)::after {
		background: var(--accent, #000080);
		content: '';
		inset: 0;
		mask-image: var(--icon-url);
		mask-mode: alpha;
		mask-position: center;
		mask-repeat: no-repeat;
		mask-size: contain;
		opacity: 0.6;
		pointer-events: none;
		position: absolute;
		z-index: 2;
	}
}

@container (max-height: 52px) {
	.icon {
		grid-template-rows: 1fr;
	}
	.label {
		display: none;
	}
}
</style>
