import { computed, ref } from 'vue';
import { createInjectionState, useElementBounding } from '@vueuse/core';

const [provideDesktopContext, useDesktopContextRaw] = createInjectionState(() => {
	const screenEl = ref<HTMLElement | null>(null);
	const taskbarEl = ref<HTMLElement | null>(null);
	const { width: screenW, height: screenH } = useElementBounding(screenEl);
	const { height: taskbarH } = useElementBounding(taskbarEl);
	const screenRect = computed(() => ({ x: 0, y: 0, width: screenW.value, height: screenH.value }));
	const usableRect = computed(() => ({
		x: 0,
		y: 0,
		width: screenW.value,
		height: Math.max(0, screenH.value - taskbarH.value)
	}));
	return { screenEl, taskbarEl, screenRect, usableRect };
});

function useDesktopContext(): NonNullable<ReturnType<typeof useDesktopContextRaw>> {
	const context = useDesktopContextRaw();
	if (!context) {
		throw new Error('useDesktopContext() must be called inside a component rendered by Desktop or AppRoute.');
	}
	return context;
}

export { provideDesktopContext, useDesktopContext };
