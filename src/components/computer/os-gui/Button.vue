<script setup lang="ts">
const {
	variant = 'basic',
	disabled = false,
	pressed = false
} = defineProps<{
	variant?: 'basic' | 'default' | 'toggle' | 'lightweight';
	disabled?: boolean;
	/** pressed state for toggle buttons. bind with v-model:pressed or :pressed + @toggled */
	pressed?: boolean;
}>();

const emit = defineEmits<{
	toggled: [value: boolean];
	click: [event: PointerEvent];
}>();

function handleClick(event: PointerEvent): void {
	if (disabled) {
		return;
	}
	if (variant === 'toggle') {
		emit('toggled', !pressed);
	}
	emit('click', event);
}
</script>

<template>
	<button
		:class="{
			default: variant === 'default',
			toggle: variant === 'toggle',
			lightweight: variant === 'lightweight',
			selected: variant === 'toggle' && pressed
		}"
		:disabled="disabled"
		:aria-pressed="variant === 'toggle' ? pressed : undefined"
		@click="handleClick">
		<slot />
	</button>
</template>
