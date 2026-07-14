<script setup lang="ts">
import { Shader } from 'shaders';
import { get } from '@vueuse/core';
import { onMounted, useTemplateRef } from 'vue';

interface ShaderInstance {
	$el: HTMLElement;
}

const shader = useTemplateRef<ShaderInstance>('shader');

onMounted(() => {
	const el = get(shader)?.$el;
	if (el) {
		el.classList.value = [...new Set(el.classList)].join(' ');
	}
});
</script>

<template>
	<Shader ref="shader" :disable-telemetry="true" v-bind="$attrs">
		<slot />
	</Shader>
</template>
