<script setup lang="ts">
import src from '@assets/images/svg/activate-windows.svg';

const onWindows = navigator.platform.startsWith('Win');
</script>

<template>
	<img v-if="onWindows" :src id="activate-windows" alt="Uninstall Windows" />
</template>

<style scoped>
#activate-windows {
	bottom: calc(var(--taskbar-h, 40px) + (2.5 * var(--su, 10px)));
	pointer-events: none;
	position: absolute;
	right: 0;
	z-index: 9999;
}
</style>
