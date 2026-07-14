<script setup lang="ts">
import 'gridstack/dist/gridstack.min.css';
import AppWindow from '@compunents/AppWindow.vue';
import SelectionRect from '@compunents/SelectionRect.vue';
import { GridStack } from 'gridstack';
import { GRID_COLUMNS, GRID_ROWS, useDesktopStore } from '@store/desktop.ts';
import { APP_IDS, getApp, getIcon, getIconShader } from '@components/computer/apps';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { get, useElementBounding, useElementSize, useEventListener, useTimeoutFn } from '@vueuse/core';
import type { GridStackNode } from 'gridstack';
import type { AppID } from '@components/computer/apps';

interface DragRect {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

const desktopStore = useDesktopStore();
const gridEl = useTemplateRef<HTMLElement>('gridEl');
const desktopEl = useTemplateRef<HTMLElement>('desktopEl');
const { height: desktopHeight } = useElementSize(desktopEl);

desktopStore.ensureAllApps();

const items = computed(() =>
	APP_IDS.map((id) => {
		const entry = getApp(id);
		return {
			id,
			pos: desktopStore.iconGrid[id] ?? entry.position,
			component: entry.component,
			link: entry.link ?? null,
			icon: getIcon(entry),
			shaderOptions: getIconShader(entry)
		};
	})
);

function useDesktopDrag(): { selectionRect: ReturnType<typeof ref<DragRect | null>> } {
	const bounds = useElementBounding(desktopEl);
	const rect = ref<DragRect | null>(null);

	let start: { x: number; y: number } | null = null;
	let iconRects: { id: AppID; x1: number; y1: number; x2: number; y2: number }[] = [];
	const { start: scheduleClear, stop: cancelClear } = useTimeoutFn(
		() => {
			rect.value = null;
		},
		100,
		{ immediate: false }
	);

	function toLocal(e: PointerEvent): { x: number; y: number } {
		return {
			x: Math.max(0, Math.min(get(bounds.width), e.clientX - get(bounds.left))),
			y: Math.max(0, Math.min(get(bounds.height), e.clientY - get(bounds.top)))
		};
	}

	useEventListener(desktopEl, 'pointerdown', (e: PointerEvent) => {
		const desktop = get(desktopEl);
		const grid = get(gridEl);
		if (
			!desktop ||
			!grid ||
			!(e.target instanceof HTMLElement) ||
			!desktop.contains(e.target) ||
			e.target.closest('[gs-id]')
		) {
			return;
		}
		if (e.target !== desktop && e.target !== grid) {
			return;
		}
		start = toLocal(e);
		const { left, top } = desktop.getBoundingClientRect();
		iconRects = [];
		for (const item of get(items)) {
			const el = grid.querySelector(`[gs-id="${item.id}"] .grid-stack-item-content`);
			if (!el) {
				continue;
			}
			const b = el.getBoundingClientRect();
			iconRects.push({ id: item.id, x1: b.left - left, y1: b.top - top, x2: b.right - left, y2: b.bottom - top });
		}
		cancelClear();
		desktopStore.setSelectedIcon(null);
	});

	useEventListener(window, 'pointermove', (e: PointerEvent) => {
		if (!start) {
			return;
		}
		const desktop = get(desktopEl);
		const grid = get(gridEl);
		if (!desktop || !grid) {
			return;
		}
		const current = toLocal(e);
		const r: DragRect = {
			x1: Math.min(start.x, current.x),
			y1: Math.min(start.y, current.y),
			x2: Math.max(start.x, current.x),
			y2: Math.max(start.y, current.y)
		};
		rect.value = r;
		const selected = new Set<string>();
		for (const ir of iconRects) {
			if (!(ir.x2 < r.x1 || ir.x1 > r.x2 || ir.y2 < r.y1 || ir.y1 > r.y2)) {
				selected.add(ir.id);
			}
		}
		desktopStore.setSelectedIcons(selected);
	});

	useEventListener(window, 'pointerup', () => {
		if (!start) {
			return;
		}
		start = null;
		scheduleClear();
	});

	return { selectionRect: rect };
}

const { selectionRect } = useDesktopDrag();

let grid: GridStack | null = null;

function queryGridItem(id: string): HTMLElement | null {
	return get(gridEl)?.querySelector<HTMLElement>(`[gs-id="${id}"]`) ?? null;
}

watch(desktopHeight, (h) => {
	if (grid && h > 0) {
		grid.cellHeight(Math.floor(h / GRID_ROWS));
	}
});

onMounted(() => {
	if (!get(gridEl)) {
		return;
	}

	const initOptions = {
		column: GRID_COLUMNS,
		maxRow: GRID_ROWS,
		float: true,
		disableResize: true,
		animate: true,
		margin: 2
	} as const;

	try {
		grid = GridStack.init(initOptions, get(gridEl)!);
	} catch (error) {
		console.warn('GridStack init failed, resetting icon positions to defaults', error);
		desktopStore.resetToDefaults();
		if (get(gridEl)) {
			for (const item of get(items)) {
				const el = queryGridItem(item.id);
				if (el) {
					el.setAttribute('gs-x', String(item.pos.x));
					el.setAttribute('gs-y', String(item.pos.y));
				}
			}
			grid = GridStack.init(initOptions, get(gridEl)!);
		}
	}

	if (!grid) {
		return;
	}

	grid.on('change', (_event, changedItems: GridStackNode[]) => {
		if (!changedItems?.length) {
			return;
		}
		for (const item of changedItems) {
			if (item.id) {
				desktopStore.updateIconPosition(item.id as AppID, item.x!, item.y!);
			}
		}
	});

	nextTick(() => {
		if (!grid || !get(gridEl)) {
			return;
		}

		for (const item of get(items)) {
			const el = queryGridItem(item.id);
			if (el) {
				grid.makeWidget(el);
			}
		}
	});
});

onBeforeUnmount(() => {
	grid?.destroy(false);
	grid = null;
});
</script>

<template>
	<div ref="desktopEl" id="desktop" @click.self="desktopStore.setSelectedIcon(null)">
		<div ref="gridEl" class="grid-stack desktop-grid">
			<div
				v-for="item in items"
				:key="item.id"
				class="grid-stack-item"
				:gs-id="item.id"
				:gs-x="item.pos.x"
				:gs-y="item.pos.y"
				gs-w="1"
				gs-h="1">
				<div class="grid-stack-item-content icon-cell">
					<AppWindow
						v-if="!item.component"
						:app-i-d="item.id"
						:icon="item.icon"
						:link="item.link"
						:shader-options="item.shaderOptions" />
					<component v-else :is="item.component" />
				</div>
			</div>
		</div>

		<SelectionRect v-if="selectionRect" :rect="selectionRect" />
	</div>
</template>

<style scoped>
#desktop {
	inset: 0;
	bottom: var(--taskbar-h);
	isolation: isolate;
	overflow: hidden;
	position: absolute;
	user-select: none;

	& .grid .cell {
		container-type: size;
		height: 100%;
		width: 100%;
	}
}
</style>
