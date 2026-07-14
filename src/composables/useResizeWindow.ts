import { ref } from 'vue';
import { useEventListener } from '@vueuse/core';
import type { Ref } from 'vue';

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
export const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

interface UseResizeWindowOptions {
	windowEl: Ref<HTMLElement | null>;
	x: Ref<number>;
	y: Ref<number>;
	width: Ref<number>;
	height: Ref<number>;
	minWidth?: number;
	minHeight?: number;
	bounds: Ref<{ x: number; y: number; width: number; height: number }>;
	onResizeEnd?: () => void;
}

interface UseResizeWindowReturn {
	isResizing: Ref<boolean>;
	startResize: (handle: ResizeHandle, e: PointerEvent) => void;
}

export function useResizeWindow(options: UseResizeWindowOptions): UseResizeWindowReturn {
	const isResizing = ref(false);

	let activeHandle: ResizeHandle | null = null;
	let startPointerX = 0;
	let startPointerY = 0;
	let startX = 0;
	let startY = 0;
	let startW = 0;
	let startH = 0;

	const MIN_W = options.minWidth ?? 80;
	const MIN_H = options.minHeight ?? 40;

	function setIFrameInteractive(interactive: boolean): void {
		const iframes = options.windowEl.value?.querySelectorAll<HTMLIFrameElement>('iframe');
		if (!iframes) {
			return;
		}
		for (const f of iframes) {
			f.style.pointerEvents = interactive ? '' : 'none';
		}
	}

	useEventListener(document, 'pointermove', (e: PointerEvent) => {
		if (!activeHandle) {
			return;
		}

		const dx = e.clientX - startPointerX;
		const dy = e.clientY - startPointerY;
		const rect = options.bounds.value;

		let newX = startX;
		let newY = startY;
		let newW = startW;
		let newH = startH;

		if (activeHandle.includes('e')) {
			newW = startW + dx;
		}
		if (activeHandle.includes('w')) {
			newW = startW - dx;
			newX = startX + dx;
		}
		if (activeHandle.includes('s')) {
			newH = startH + dy;
		}
		if (activeHandle.includes('n')) {
			newH = startH - dy;
			newY = startY + dy;
		}

		if (newW < MIN_W) {
			if (activeHandle.includes('w')) {
				newX = startX + startW - MIN_W;
			}
			newW = MIN_W;
		}
		if (newH < MIN_H) {
			if (activeHandle.includes('n')) {
				newY = startY + startH - MIN_H;
			}
			newH = MIN_H;
		}

		if (newX < rect.x) {
			newW -= rect.x - newX;
			newX = rect.x;
		}
		if (newY < rect.y) {
			newH -= rect.y - newY;
			newY = rect.y;
		}
		if (newX + newW > rect.x + rect.width) {
			newW = rect.x + rect.width - newX;
		}
		if (newY + newH > rect.y + rect.height) {
			newH = rect.y + rect.height - newY;
		}

		newW = Math.max(MIN_W, newW);
		newH = Math.max(MIN_H, newH);

		options.x.value = newX;
		options.y.value = newY;
		options.width.value = newW;
		options.height.value = newH;
	});

	useEventListener(document, 'pointerup', () => {
		if (!activeHandle) {
			return;
		}
		activeHandle = null;
		isResizing.value = false;
		setIFrameInteractive(true);
		options.onResizeEnd?.();
	});

	function startResize(handle: ResizeHandle, e: PointerEvent): void {
		e.preventDefault();
		activeHandle = handle;
		isResizing.value = true;
		startPointerX = e.clientX;
		startPointerY = e.clientY;
		startX = options.x.value;
		startY = options.y.value;
		startW = options.width.value || options.windowEl.value?.offsetWidth || 200;
		startH = options.height.value || options.windowEl.value?.offsetHeight || 150;
		setIFrameInteractive(false);
	}

	return { isResizing, startResize };
}
