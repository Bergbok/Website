<script setup lang="ts">
import { useTemplateRef } from 'vue';

const {
	type = 'inset',
	depth = 'shallow',
	as = 'div'
} = defineProps<{
	/** inset (recessed) or outset (raised) */
	type?: 'inset' | 'outset';
	/** border depth */
	depth?: 'shallow' | 'deep';
	/** HTML tag to render as */
	as?: string;
}>();

const rootEl = useTemplateRef<HTMLElement>('rootEl');
defineExpose({ rootEl });
</script>

<template>
	<component :is="as" ref="rootEl" :class="`${type}-${depth}`">
		<slot />
	</component>
</template>
