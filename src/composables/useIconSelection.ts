import { computed } from 'vue';
import { useDesktopStore } from '@store/desktop.ts';
import { useSettingsStore } from '@store/settings.ts';
import type { Ref } from 'vue';

function recolorSVG(svgText: string, color: string): Document {
	const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
	doc.documentElement.setAttribute('fill', color);
	doc.documentElement.setAttribute('color', color);
	for (const el of doc.querySelectorAll('[fill]')) {
		const fill = el.getAttribute('fill')!.trim();
		if (fill === 'none' || fill === 'currentColor' || fill === 'white') {
			continue;
		}
		if (el.closest('defs, mask, clipPath')) {
			continue;
		}
		el.setAttribute('fill', color);
	}
	for (const el of doc.querySelectorAll('[style]')) {
		const style = el.getAttribute('style')!;
		const newStyle = style.replace(/\bfill\s*:\s*([^;]+)/g, (m, v) => (v.trim() === 'none' ? m : `fill:${color}`));
		if (newStyle !== style) {
			el.setAttribute('style', newStyle);
		}
	}
	return doc;
}

export interface UseIconSelectionOptions {
	id: string;
	link?: string;
	keepSelection?: boolean;
	icon: Ref<string>;
	shadered: Ref<boolean>;
	onOpen: () => void;
}

export interface UseIconSelectionReturn {
	selected: Ref<boolean>;
	isSVG: Ref<boolean>;
	selectedSVG: Ref<string | null>;
	onClick: (e: MouseEvent) => void;
	onDblClick: () => void;
	open: () => void;
}

const selectedSvgCache = new Map<string, string>();

export function useIconSelection(options: UseIconSelectionOptions): UseIconSelectionReturn {
	const { id, link, keepSelection, icon, shadered, onOpen } = options;

	const desktopStore = useDesktopStore();
	const settingsStore = useSettingsStore();

	const selected = computed(() => desktopStore.selectedIcons.has(id));

	const isSVG = computed(() => icon.value.startsWith('data:image/svg+xml'));

	const selectedSVG = computed(() => {
		if (!selected.value || shadered.value || !isSVG.value) {
			return null;
		}

		const src = icon.value;
		const accent = settingsStore.accentColor;
		const cacheKey = `${accent}\0${src}`;
		const cached = selectedSvgCache.get(cacheKey);
		if (cached) {
			return cached;
		}

		const comma = src.indexOf(',');
		if (comma === -1) {
			return null;
		}

		const encoded = src.slice(comma + 1);
		const svgText = src.startsWith('data:image/svg+xml;base64,') ? atob(encoded) : decodeURIComponent(encoded);

		const svg = recolorSVG(svgText, accent);
		const result = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
		selectedSvgCache.set(cacheKey, result);
		return result;
	});

	function open(): void {
		if (link) {
			window.open(link, '_blank', 'noopener');
		} else {
			onOpen();
		}
	}

	function onClick(e: MouseEvent): void {
		if (keepSelection && selected.value) {
			open();
			return;
		}
		desktopStore.setSelectedIcon(id, e.ctrlKey);
	}

	function onDblClick(): void {
		if (!keepSelection) {
			desktopStore.setSelectedIcon(null);
		}
		open();
	}

	return { selected, isSVG, selectedSVG, onClick, onDblClick, open };
}
