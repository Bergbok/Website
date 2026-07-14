<script setup lang="ts">
import { get } from '@vueuse/core';
import { MenuBar as OSGUIMenuBar } from 'os-gui/MenuBar.js';
import { onMounted, onUnmounted, useTemplateRef } from 'vue';

const { menus } = defineProps<{
	menus: OSGUITopLevelMenus;
}>();

const emit = defineEmits<{
	/** emitted when hovering over a menu item that declares a `description` */
	'info': [description: string];
	/** emitted when the cursor leaves a menu item with a description */
	'default-info': [];
}>();

const containerEl = useTemplateRef<HTMLElement>('containerEl');
let instance: ReturnType<MenuBarConstructor> | null = null;

onMounted(() => {
	if (!get(containerEl)) {
		return;
	}
	instance = new OSGUIMenuBar(menus);
	get(containerEl)!.appendChild(instance.element);
	instance.element.addEventListener('info', (e: Event) => {
		emit('info', (e as CustomEvent<{ description?: string }>).detail?.description ?? '');
	});
	instance.element.addEventListener('default-info', () => {
		emit('default-info');
	});
});

onUnmounted(() => {
	instance?.element.remove();
	instance = null;
});
</script>

<template>
	<div ref="containerEl" />
</template>
