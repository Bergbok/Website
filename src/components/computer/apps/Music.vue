<script setup lang="ts">
import Icon from '@compunents/Icon.vue';
import { computed } from 'vue';
import { useWebampStore } from '@store/webamp.ts';
import { useExternalizedApp } from '@composables/useApp.ts';
import { getApp, getIcon, getLabel } from '@components/computer/apps';

const entry = getApp('webamp');
const webampStore = useWebampStore();

useExternalizedApp('webamp', {
	isOpen: computed(() => webampStore.isOpen),
	isMinimized: computed(() => webampStore.isMinimized),
	onTaskbarToggle: () => webampStore.toggle()
});
</script>

<template>
	<Icon id="webamp" :label="getLabel(entry, 'icon')" :icon="getIcon(entry)" @open="webampStore.open()" />
</template>
