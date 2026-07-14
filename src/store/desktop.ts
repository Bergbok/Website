import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import { APP_IDS, APPS } from '@components/computer/apps';
import type { GridStackPosition } from 'gridstack';

export const GRID_COLUMNS = 12;
export const GRID_ROWS = 9;

function defaultGrid(): Record<string, GridStackPosition> {
	return Object.fromEntries(
		APP_IDS.map((id) => {
			const { x, y } = APPS[id].position;
			return [id, { x, y }];
		})
	);
}

export const useDesktopStore = defineStore('desktop', () => {
	const selectedIcons = ref<Set<string>>(new Set());
	const iconGrid = useLocalStorage<Record<string, GridStackPosition>>('desktop:icon-grid', defaultGrid());

	function ensureAllApps(): void {
		const missing = APP_IDS.filter((id) => !(id in iconGrid.value));
		if (!missing.length) {
			return;
		}

		const occupied = new Set(Object.values(iconGrid.value).map(({ x, y }) => `${x},${y}`));
		const hasDuplicates = occupied.size !== Object.keys(iconGrid.value).length;
		const hasConflict = missing.some((id) => occupied.has(`${APPS[id].position.x},${APPS[id].position.y}`));

		function place(id: keyof typeof APPS, taken: Set<string>): GridStackPosition {
			const { x, y } = APPS[id].position;
			if (!taken.has(`${x},${y}`)) {
				taken.add(`${x},${y}`);
				return { x, y };
			}
			for (let row = 0; row < GRID_ROWS; row++) {
				for (let col = 0; col < GRID_COLUMNS; col++) {
					const key = `${col},${row}`;
					if (!taken.has(key)) {
						taken.add(key);
						return { x: col, y: row };
					}
				}
			}
			return { x, y };
		}

		if (hasConflict || hasDuplicates) {
			const taken = new Set<string>();
			iconGrid.value = Object.fromEntries(APP_IDS.map((id) => [id, place(id, taken)]));
			return;
		}

		for (const id of missing) {
			iconGrid.value[id] = place(id, occupied);
		}
	}

	function setSelectedIcon(id: string | null, addToSelection = false): void {
		if (!id) {
			selectedIcons.value = new Set();
		} else if (addToSelection) {
			const next = new Set(selectedIcons.value);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			selectedIcons.value = next;
		} else {
			selectedIcons.value = new Set([id]);
		}
	}

	function setSelectedIcons(ids: Set<string>): void {
		selectedIcons.value = new Set(ids);
	}

	function updateIconPosition(id: string, x: number, y: number): void {
		iconGrid.value[id] = { x, y };
	}

	function resetToDefaults(): void {
		iconGrid.value = defaultGrid();
	}

	return {
		iconGrid,
		selectedIcons,
		ensureAllApps,
		resetToDefaults,
		setSelectedIcon,
		setSelectedIcons,
		updateIconPosition
	};
});
