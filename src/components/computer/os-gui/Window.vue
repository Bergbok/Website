<script setup lang="ts">
import { useWmStore } from '@store/wm.ts';
import { useDesktopContext } from '@composables/useDesktop.ts';
import { get, onLongPress, useDraggable, useFullscreen } from '@vueuse/core';
import { useIFrameFocusRelay } from '@composables/useIFrameFocusRelay.ts';
import { RESIZE_HANDLES, useResizeWindow } from '@composables/useResizeWindow.ts';
import { computed, onMounted, onUnmounted, ref, useSlots, useTemplateRef, watch } from 'vue';
import type { AppID } from '@components/computer/apps';
import type { ResizeHandle } from '@composables/useResizeWindow.ts';

interface WindowGeometryLocal {
	x: number;
	y: number;
	w: number;
	h: number;
}

const {
	appID,
	label,
	initialX,
	initialY,
	width,
	height,
	minWidth,
	minHeight,
	toolWindow = false,
	resizable = true,
	minimizeButton = true,
	maximizeButton = true,
	closeButton = true,
	maximized = false,
	persistGeometry = true,
	icon,
	icons,
	visible = true
} = defineProps<{
	/** app registry key - required for taskbar/per-app-geometry tracking */
	appID: AppID;
	/** window title bar text */
	label: string;
	/** initial left position (px), omit to centre horizontally */
	initialX?: number;
	/** initial top position (px), omit to centre vertically */
	initialY?: number;
	width: number;
	height: number;
	minWidth?: number;
	minHeight?: number;
	toolWindow?: boolean;
	resizable?: boolean;
	minimizeButton?: boolean;
	maximizeButton?: boolean;
	closeButton?: boolean;
	maximized?: boolean;
	persistGeometry?: boolean;
	icon?: string;
	icons?: Record<number | 'any', string>;
	/** when false the window unregisters from the taskbar without unmounting. */
	visible?: boolean;
}>();

const emit = defineEmits<{
	close: [];
}>();

defineSlots<{
	menubar?: () => unknown;
	default?: () => unknown;
}>();

const wm = useWmStore();
const slots = useSlots();
const record = ref(wm.register(appID, label, icon));
const id = computed(() => get(record).id);
const { screenEl, screenRect, usableRect } = useDesktopContext();

watch(
	() => visible,
	(v, oldV) => {
		if (oldV === undefined) {
			return;
		}
		if (v) {
			wm.unregister(get(record).id);
			record.value = wm.register(appID, label, icon);
		} else {
			wm.unregister(get(record).id);
		}
	}
);

const windowEl = useTemplateRef<HTMLElement>('windowEl');
const titlebarEl = useTemplateRef<HTMLElement>('titlebarEl');
const contentEl = useTemplateRef<HTMLElement>('contentEl');
const maximizeButtonEl = useTemplateRef<HTMLButtonElement>('maximizeButtonEl');

const { toggle: toggleFullscreen } = useFullscreen(contentEl);
const suppressNextMaximizeClick = ref(false);

onLongPress(
	maximizeButtonEl,
	() => {
		suppressNextMaximizeClick.value = true;
		toggleFullscreen();
	},
	{
		delay: 350,
		modifiers: { stop: true, prevent: true }
	}
);

const isMinimized = computed(() => get(record).isMinimized);
const isFocused = computed(() => wm.focusedWindowID === get(id));
const zIndex = computed(() => get(record).zIndex);

const isMaximized = ref(false);
const isManuallyDragging = ref(false);

const TITLEBAR_HEIGHT = 18;
const MENUBAR_HEIGHT = 20;
const hasMenubar = computed(() => Boolean(slots.menubar));
const chromeHeight = computed(() => TITLEBAR_HEIGHT + (get(hasMenubar) ? MENUBAR_HEIGHT : 0));

const savedGeo = persistGeometry ? (wm.geometry[appID] ?? null) : null;
const windowW = ref(savedGeo?.w ?? width ?? 0);
const windowH = ref(savedGeo?.h ?? (height ? height + get(chromeHeight) : 0));
const savedRestoreGeometry = ref<WindowGeometryLocal | null>(null);

const effectiveMinHeight = computed(() =>
	minHeight !== undefined && minHeight !== null ? minHeight + get(chromeHeight) : undefined
);

const resolvedIcon = computed((): string | null => {
	if (icons) {
		const sizes = Object.keys(icons)
			.map(Number)
			.filter(Boolean)
			.toSorted((a, b) => a - b);
		const selectedSize = sizes.find((s) => s >= 16) ?? sizes[sizes.length - 1];
		if (typeof selectedSize === 'number') {
			return icons[selectedSize] ?? null;
		}
		return icons.any;
	}
	return icon ?? null;
});

const { x, y, isDragging } = useDraggable(windowEl, {
	handle: titlebarEl,
	containerElement: screenEl,
	initialValue: { x: savedGeo?.x ?? initialX ?? 0, y: savedGeo?.y ?? initialY ?? 0 },
	disabled: isMaximized
});

function persistCurrentGeometry(): void {
	if (!persistGeometry) {
		return;
	}
	wm.saveGeometry(appID, {
		x: get(x),
		y: get(y),
		w: get(windowW),
		h: get(windowH),
		maximized: get(isMaximized)
	});
}

const { isResizing, startResize } = useResizeWindow({
	windowEl,
	x,
	y,
	width: windowW,
	height: windowH,
	minWidth,
	minHeight: get(effectiveMinHeight),
	bounds: screenRect,
	onResizeEnd: persistCurrentGeometry
});

watch(isDragging, (dragging, wasDragging) => {
	if (wasDragging && !dragging) {
		persistCurrentGeometry();
	}
});

const windowStyle = computed<Record<string, string>>(() => {
	if (get(isMaximized)) {
		const rect = get(usableRect);
		return {
			position: 'absolute',
			left: `${rect.x}px`,
			top: `${rect.y}px`,
			width: `${rect.width}px`,
			height: `${rect.height}px`,
			zIndex: String(get(zIndex))
		};
	}
	const s: Record<string, string> = {
		position: 'absolute',
		left: `${get(x)}px`,
		top: `${get(y)}px`,
		zIndex: String(get(zIndex))
	};
	if (get(windowW) > 0) {
		s.width = `${get(windowW)}px`;
	}
	if (get(windowH) > 0) {
		s.height = `${get(windowH)}px`;
	}
	if (minWidth) {
		s.minWidth = `${minWidth}px`;
	}
	if (get(effectiveMinHeight)) {
		s.minHeight = `${get(effectiveMinHeight)}px`;
	}
	return s;
});

const windowClasses = computed(() => ({
	'focused': get(isFocused),
	'dragging': get(isDragging) || get(isManuallyDragging),
	'resizing': get(isResizing),
	'tool-window': toolWindow,
	'maximized': get(isMaximized),
	'minimized-without-taskbar': get(isMinimized)
}));

function bringToFront(): void {
	wm.bringToFront(get(id));
}

function doMinimize(): void {
	wm.setMinimized(get(id), !get(record).isMinimized);
}

function doMaximize(): void {
	if (get(record).isMinimized) {
		wm.setMinimized(get(id), false);
	} else if (get(isMaximized)) {
		isMaximized.value = false;
		if (get(savedRestoreGeometry)) {
			x.value = get(savedRestoreGeometry)!.x;
			y.value = get(savedRestoreGeometry)!.y;
			windowW.value = get(savedRestoreGeometry)!.w;
			windowH.value = get(savedRestoreGeometry)!.h;
			savedRestoreGeometry.value = null;
		}
		persistCurrentGeometry();
	} else {
		savedRestoreGeometry.value = {
			x: get(x),
			y: get(y),
			w: get(windowW) || get(windowEl)?.offsetWidth || 400,
			h: get(windowH) || get(windowEl)?.offsetHeight || 300
		};
		isMaximized.value = true;
		persistCurrentGeometry();
	}
}

function onMaximizeClick(): void {
	if (get(suppressNextMaximizeClick)) {
		suppressNextMaximizeClick.value = false;
		return;
	}
	doMaximize();
}

function setPosition(newX: number, newY: number): void {
	x.value = newX;
	y.value = newY;
}

const UNMAXIMIZE_DRAG_THRESHOLD = 4;
let cancelPendingUnmaximize: (() => void) | null = null;

function onTitlebarPointerDownCapture(e: PointerEvent): void {
	if (!get(isMaximized) || e.button !== 0 || (e.target as Element).closest('button')) {
		return;
	}

	const startX = e.clientX;
	const startY = e.clientY;
	let onMove: ((me: PointerEvent) => void) | null = null;

	const cleanupPending = (): void => {
		if (onMove) {
			window.removeEventListener('pointermove', onMove, true);
		}
		window.removeEventListener('pointerup', cleanupPending, true);
		cancelPendingUnmaximize = null;
	};

	onMove = (me: PointerEvent): void => {
		if (Math.hypot(me.clientX - startX, me.clientY - startY) < UNMAXIMIZE_DRAG_THRESHOLD) {
			return;
		}
		cleanupPending();

		const screen = get(screenEl);
		if (!screen) {
			return;
		}
		const sb = screen.getBoundingClientRect();
		const cursorX = me.clientX - sb.left;
		const cursorY = me.clientY - sb.top;
		const restoredW = get(savedRestoreGeometry)?.w ?? get(windowEl)?.offsetWidth ?? 400;

		doMaximize();
		x.value = Math.max(0, Math.min(Math.round(cursorX - restoredW * 0.25), get(usableRect).width - restoredW));
		y.value = Math.max(0, Math.round(cursorY - 8));

		const offsetX = cursorX - get(x);
		const offsetY = cursorY - get(y);
		isManuallyDragging.value = true;

		const onManualMove = (mme: PointerEvent): void => {
			const rect = get(usableRect);
			const elW = get(windowW) || get(windowEl)?.offsetWidth || 400;
			const elH = get(windowH) || get(windowEl)?.offsetHeight || 300;
			x.value = Math.max(0, Math.min(mme.clientX - sb.left - offsetX, rect.width - elW));
			y.value = Math.max(0, Math.min(mme.clientY - sb.top - offsetY, rect.height - elH));
		};
		const onManualUp = (): void => {
			window.removeEventListener('pointermove', onManualMove, true);
			isManuallyDragging.value = false;
			persistCurrentGeometry();
		};
		window.addEventListener('pointermove', onManualMove, true);
		window.addEventListener('pointerup', onManualUp, { capture: true, once: true });
	};

	cancelPendingUnmaximize = cleanupPending;

	window.addEventListener('pointermove', onMove, true);
	window.addEventListener('pointerup', cleanupPending, { capture: true, once: true });
}

onUnmounted(() => {
	cancelPendingUnmaximize?.();
});

function onTitlebarDblClick(e: MouseEvent): void {
	if ((e.target as Element).closest('button')) {
		return;
	}
	doMaximize();
}

watch([(): number => get(usableRect).width, (): number => get(usableRect).height], ([newW, newH], [oldW, oldH]) => {
	if (!oldW || !oldH || !newW || !newH || get(isMaximized)) {
		return;
	}
	const scaleX = newW / oldW;
	const scaleY = newH / oldH;
	const newWindowW = get(windowW) > 0 ? Math.min(newW, Math.round(get(windowW) * scaleX)) : 0;
	const newWindowH = get(windowH) > 0 ? Math.min(newH, Math.round(get(windowH) * scaleY)) : 0;
	const effectiveW = newWindowW || get(windowEl)?.offsetWidth || 100;
	const effectiveH = newWindowH || get(windowEl)?.offsetHeight || 100;
	x.value = Math.max(0, Math.min(Math.round(get(x) * scaleX), newW - effectiveW));
	y.value = Math.max(0, Math.min(Math.round(get(y) * scaleY), newH - effectiveH));
	if (newWindowW > 0) {
		windowW.value = newWindowW;
	}
	if (newWindowH > 0) {
		windowH.value = newWindowH;
	}
	persistCurrentGeometry();
});

useIFrameFocusRelay(windowEl, bringToFront);

function clampWindowGeometry(): void {
	const rect = get(usableRect);
	if (!rect.width || !rect.height) {
		return;
	}
	let scale = 1;
	if (get(windowW) > 0 && get(windowW) > rect.width) {
		scale = Math.min(scale, rect.width / get(windowW));
	}
	if (get(windowH) > 0 && get(windowH) > rect.height) {
		scale = Math.min(scale, rect.height / get(windowH));
	}
	if (scale < 1) {
		if (get(windowW) > 0) {
			windowW.value = Math.round(get(windowW) * scale);
		}
		if (get(windowH) > 0) {
			windowH.value = Math.round(get(windowH) * scale);
		}
	}
	const w = get(windowW) || get(windowEl)?.offsetWidth || 300;
	const h = get(windowH) || get(windowEl)?.offsetHeight || 200;
	const hasSavedPosition = savedGeo !== null;
	if (!hasSavedPosition && typeof initialX === 'undefined') {
		x.value = rect.x + Math.max(0, Math.round((rect.width - w) / 2));
	}
	if (!hasSavedPosition && typeof initialY === 'undefined') {
		y.value = rect.y + Math.max(0, Math.round((rect.height - h) / 2));
	}
	if (get(x) + w > rect.width) {
		x.value = Math.max(0, rect.width - w);
	}
	if (get(y) + h > rect.height) {
		y.value = Math.max(0, rect.height - h);
	}
}

onMounted(() => {
	bringToFront();
	clampWindowGeometry();
	const shouldMaximize = savedGeo?.maximized ?? maximized;
	if (shouldMaximize) {
		doMaximize();
	}
});

onUnmounted(() => {
	persistCurrentGeometry();
	wm.unregister(get(id));
});

defineExpose({
	isMinimized,
	isMaximized,
	isFocused,
	doMinimize,
	doMaximize,
	bringToFront,
	windowID: id,
	windowEl,
	setPosition
});
</script>

<template>
	<div
		v-show="!isMinimized"
		ref="windowEl"
		class="os-window"
		:class="windowClasses"
		:style="windowStyle"
		@pointerdown="bringToFront"
		@focusin="bringToFront">
		<div
			ref="titlebarEl"
			class="window-titlebar"
			@pointerdown.capture="onTitlebarPointerDownCapture"
			@dblclick="onTitlebarDblClick">
			<img v-if="resolvedIcon" :src="resolvedIcon" class="icon" width="16" height="16" draggable="false" alt="" />
			<div class="window-title-area">
				<span class="window-title">{{ label }}</span>
			</div>

			<template v-if="!toolWindow">
				<button
					v-if="minimizeButton"
					class="window-button window-minimize-button window-action-minimize"
					aria-label="Minimize"
					@click.stop="doMinimize">
					<span class="window-button-icon" />
				</button>
				<button
					v-if="maximizeButton"
					ref="maximizeButtonEl"
					class="window-button window-maximize-button"
					:class="isMaximized ? 'window-action-restore' : 'window-action-maximize'"
					aria-label="Maximize"
					@click.stop="onMaximizeClick">
					<span class="window-button-icon" />
				</button>
			</template>

			<button
				v-if="closeButton"
				class="window-button window-close-button window-action-close"
				aria-label="Close"
				@click.stop="emit('close')">
				<span class="window-button-icon" />
			</button>
		</div>

		<slot name="menubar" />

		<div ref="contentEl" class="window-content">
			<slot />
		</div>

		<template v-if="resizable && !isMaximized">
			<div
				v-for="handle in RESIZE_HANDLES"
				:key="handle"
				:class="['resize-handle', `resize-${handle}`]"
				@pointerdown="startResize(handle as ResizeHandle, $event)" />
		</template>
	</div>
</template>

<style scoped>
.resize-handle {
	position: absolute;
	z-index: 1;
}

.resize-nw {
	top: 0;
	left: 0;
	width: 8px;
	height: 8px;
	cursor: nw-resize;
}

.resize-ne {
	top: 0;
	right: 0;
	width: 8px;
	height: 8px;
	cursor: ne-resize;
}

.resize-se {
	bottom: 0;
	right: 0;
	width: 8px;
	height: 8px;
	cursor: se-resize;
}

.resize-sw {
	bottom: 0;
	left: 0;
	width: 8px;
	height: 8px;
	cursor: sw-resize;
}

.resize-n {
	top: 0;
	left: 8px;
	right: 8px;
	height: 4px;
	cursor: n-resize;
}

.resize-e {
	top: 8px;
	right: 0;
	width: 4px;
	bottom: 8px;
	cursor: e-resize;
}

.resize-s {
	bottom: 0;
	left: 8px;
	right: 8px;
	height: 4px;
	cursor: s-resize;
}

.resize-w {
	top: 8px;
	left: 0;
	width: 4px;
	bottom: 8px;
	cursor: w-resize;
}
</style>
