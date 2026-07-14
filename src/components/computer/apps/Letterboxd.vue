<script setup lang="ts">
import Icon from '@compunents/Icon.vue';
import icon from '@assets/images/svg/letterboxd.svg';
import { Neon } from 'shaders/vue';
</script>

<template>
	<Icon id="letterboxd" label="Letterboxd" :icon link="https://letterboxd.com/bergbok">
		<template #shader="{ selected }">
			<Neon
				color="#00E054"
				glow-color="#00E054"
				secondary-color="#ffffff"
				shape-sdf-url=""
				shape-type="circleSDF"
				:corner-smoothing="0"
				:glow-intensity="selected ? 2 : 1.1"
				:hot-core-intensity="0"
				:intensity="4"
				:scale="0.42" />
			<Neon
				color="#FF8000"
				glow-color="#FF8000"
				secondary-color="#ffffff"
				:corner-smoothing="0"
				:glow-intensity="selected ? 2 : 1.1"
				:hot-core-intensity="0"
				:intensity="4"
				:scale="0.42"
				:transform="{ offsetX: -0.25 }" />
			<Neon
				color="#40BCF4"
				glow-color="#40BCF4"
				secondary-color="#ffffff"
				:corner-smoothing="0"
				:glow-intensity="selected ? 2 : 1.1"
				:hot-core-intensity="0"
				:intensity="4"
				:scale="0.42"
				:transform="{ offsetX: 0.25 }" />
		</template>
	</Icon>
</template>
