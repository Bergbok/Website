import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import type { AppID } from '@components/computer/apps';

export interface WindowGeometry {
	x: number;
	y: number;
	w: number;
	h: number;
	maximized: boolean;
}

export interface WindowRecord {
	id: string;
	appID: AppID;
	label: string;
	icon?: string;
	zIndex: number;
	isMinimized: boolean;
	onTaskbarToggle?: () => void;
}

export const useWmStore = defineStore('wm', () => {
	const windows = reactive(new Map<string, WindowRecord>());
	const focusedWindowID = ref<string | null>(null);
	const geometry = useLocalStorage<Record<string, WindowGeometry>>('wm:geometry', {});
	const taskOrder = useLocalStorage<AppID[]>('wm:task-order', []);

	let windowCount = 0;
	let zCount = 1;

	function nextWindowID(): string {
		return `os-window-${++windowCount}`;
	}

	function register(appID: AppID, label: string, icon: string | undefined): WindowRecord {
		const id = nextWindowID();
		const rec = reactive<WindowRecord>({
			id,
			appID,
			label,
			icon,
			zIndex: ++zCount,
			isMinimized: false
		});
		windows.set(id, rec);
		if (!taskOrder.value.includes(appID)) {
			taskOrder.value = [...taskOrder.value, appID];
		}
		focusedWindowID.value = id;
		return rec;
	}

	function unregister(id: string): void {
		const rec = windows.get(id);
		windows.delete(id);
		if (focusedWindowID.value === id) {
			focusedWindowID.value = null;
		}
		if (rec) {
			let stillHasInstance = false;
			for (const other of windows.values()) {
				if (other.appID === rec.appID) {
					stillHasInstance = true;
					break;
				}
			}
			if (!stillHasInstance) {
				const idx = taskOrder.value.indexOf(rec.appID);
				if (idx !== -1) {
					const next = [...taskOrder.value];
					next.splice(idx, 1);
					taskOrder.value = next;
				}
			}
		}
	}

	function bringToFront(id: string): void {
		const rec = windows.get(id);
		if (!rec) {
			return;
		}
		rec.zIndex = ++zCount;
		rec.isMinimized = false;
		focusedWindowID.value = id;
	}

	function setMinimized(id: string, value: boolean): void {
		const rec = windows.get(id);
		if (!rec) {
			return;
		}
		rec.isMinimized = value;
		if (value && focusedWindowID.value === id) {
			focusedWindowID.value = null;
		}
	}

	function toggleFromTaskbar(id: string): void {
		const rec = windows.get(id);
		if (!rec) {
			return;
		}
		if (rec.onTaskbarToggle) {
			rec.onTaskbarToggle();
			return;
		}
		if (rec.isMinimized) {
			bringToFront(id);
		} else if (focusedWindowID.value === id) {
			setMinimized(id, true);
		} else {
			bringToFront(id);
		}
	}

	function clearFocus(id: string): void {
		if (focusedWindowID.value === id) {
			focusedWindowID.value = null;
		}
	}

	function saveGeometry(appID: AppID, g: WindowGeometry): void {
		geometry.value = { ...geometry.value, [appID]: { ...g } };
	}

	function reorderTaskbar(order: AppID[]): void {
		taskOrder.value = order;
	}

	function findByApp(appID: AppID): WindowRecord | null {
		for (const rec of windows.values()) {
			if (rec.appID === appID) {
				return rec;
			}
		}
		return null;
	}

	const taskbarTasks = computed<WindowRecord[]>(() => {
		const byApp = new Map<AppID, WindowRecord>();
		for (const rec of windows.values()) {
			if (!byApp.has(rec.appID)) {
				byApp.set(rec.appID, rec);
			}
		}
		const list: WindowRecord[] = [];
		const seen = new Set<AppID>();
		for (const appID of taskOrder.value) {
			const rec = byApp.get(appID);
			if (rec) {
				list.push(rec);
				seen.add(appID);
			}
		}
		for (const [appID, rec] of byApp) {
			if (!seen.has(appID)) {
				list.push(rec);
			}
		}
		return list;
	});

	function resetToDefaults(): void {
		geometry.value = {};
		taskOrder.value = [];
	}

	return {
		windows,
		focusedWindowID,
		geometry,
		taskOrder,
		taskbarTasks,
		register,
		unregister,
		bringToFront,
		setMinimized,
		toggleFromTaskbar,
		clearFocus,
		saveGeometry,
		reorderTaskbar,
		resetToDefaults,
		findByApp
	};
});
