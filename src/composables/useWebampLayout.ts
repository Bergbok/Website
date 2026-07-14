import { computed, watch } from 'vue';
import { useBreakpoints, useDebounceFn, useWindowSize } from '@vueuse/core';
import type Webamp from 'webamp/butterchurn';
import type { Ref } from 'vue';
import type { AppState, WindowPositions, WindowSize } from 'webamp';

// https://github.com/captbaritone/webamp/blob/master/packages/webamp/js/constants.ts#L42
const WINDOW_WIDTH = 275;
const WINDOW_HEIGHT = 116;
const WINDOW_RESIZE_SEGMENT_WIDTH = 25;
const WINDOW_RESIZE_SEGMENT_HEIGHT = 29;
const PADDING = 20;

// 'wide'    (≥1700px): equalizer+playlist left | main center | milkdrop right  (double-size on)
// 'narrow'  (≥865px):  playlist+equalizer+main left stack | milkdrop right     (double-size on)
// 'compact' (≥590px):  playlist+equalizer+main left stack | milkdrop right     (double-size off)
// 'stacked' (<590px):  playlist+equalizer left | main+milkdrop right stack     (double-size off)

export function useWebampLayout(
	getWebamp: () => Webamp | null,
	container: Ref<HTMLElement | null>
): {
	isDoubleSizeLayout: () => boolean;
	getInitialWindowSizes: () => { milkdrop: WindowSize; playlist: WindowSize };
	updateWindowLayout: () => void;
} {
	const { width, height } = useWindowSize();
	const breakpoints = useBreakpoints({ stacked: 0, compact: 590, narrow: 865, wide: 1700 } as const);
	const activeLayout = breakpoints.active();
	type Layout = Exclude<typeof activeLayout.value, ''>;
	const layout = computed<Layout>(() => activeLayout.value || 'stacked');

	function isDoubleSizeLayout(): boolean {
		return layout.value === 'wide' || layout.value === 'narrow';
	}

	function windowPixelSize(
		extraWidth: number,
		extraHeight: number,
		canDouble: boolean,
		doubled: boolean
	): { width: number; height: number } {
		const mult = doubled && canDouble ? 2 : 1;
		return {
			width: (WINDOW_WIDTH + extraWidth * WINDOW_RESIZE_SEGMENT_WIDTH) * mult,
			height: (WINDOW_HEIGHT + extraHeight * WINDOW_RESIZE_SEGMENT_HEIGHT) * mult
		};
	}

	function calculateWindowSizes(vw: number, vh: number): { milkdrop: WindowSize; playlist: WindowSize } {
		const mainWidth = isDoubleSizeLayout() ? 550 : WINDOW_WIDTH;

		let milkdropMaxPixels = 0;
		if (layout.value === 'wide') {
			milkdropMaxPixels = Math.floor(vw / 2 - mainWidth / 2 - PADDING * 2);
		} else if (layout.value === 'stacked') {
			milkdropMaxPixels = Math.floor(vw / 2 - PADDING * 2);
		} else {
			milkdropMaxPixels = vw - mainWidth - PADDING * 3;
		}

		const milkdropExtraWidth = Math.max(
			0,
			Math.min(20, Math.floor((milkdropMaxPixels - WINDOW_WIDTH) / WINDOW_RESIZE_SEGMENT_WIDTH))
		);
		const milkdropPixelSide = WINDOW_WIDTH + milkdropExtraWidth * WINDOW_RESIZE_SEGMENT_WIDTH;
		const milkdropExtraHeightForSquare = Math.floor(
			(milkdropPixelSide - WINDOW_HEIGHT) / WINDOW_RESIZE_SEGMENT_HEIGHT
		);
		const milkdropExtraHeightMaxByScreen = Math.floor((vh * 0.85 - WINDOW_HEIGHT) / WINDOW_RESIZE_SEGMENT_HEIGHT);
		const milkdropExtraHeight = Math.max(0, Math.min(milkdropExtraHeightForSquare, milkdropExtraHeightMaxByScreen));
		const playlistExtraHeight = Math.max(3, Math.min(10, Math.floor((vh * 0.4) / WINDOW_RESIZE_SEGMENT_HEIGHT)));

		return {
			milkdrop: { extraWidth: milkdropExtraWidth, extraHeight: milkdropExtraHeight },
			playlist: { extraWidth: 0, extraHeight: playlistExtraHeight }
		};
	}

	function calculatePositions(vw: number, vh: number, state: AppState): WindowPositions {
		const { doubled } = state.display;
		const gen = state.windows.genWindows;

		function sizeOf(windowID: string, canDouble: boolean): { width: number; height: number } {
			const windowState = gen[windowID];
			return windowPixelSize(
				windowState?.size[0] ?? 0,
				windowState?.size[1] ?? 0,
				windowState?.canDouble ?? canDouble,
				doubled
			);
		}

		const equalizerSize = sizeOf('equalizer', false);
		const mainSize = sizeOf('main', true);
		const milkdropSize = sizeOf('milkdrop', false);
		const playlistSize = sizeOf('playlist', false);

		if (layout.value === 'wide') {
			return {
				equalizer: { x: PADDING, y: vh - equalizerSize.height - PADDING },
				playlist: { x: PADDING, y: vh - equalizerSize.height - playlistSize.height - PADDING * 2 },
				main: { x: vw / 2 - mainSize.width / 2, y: vh - mainSize.height - PADDING },
				milkdrop: { x: vw - milkdropSize.width - PADDING, y: vh - milkdropSize.height - PADDING }
			};
		} else if (layout.value === 'narrow' || layout.value === 'compact') {
			return {
				playlist: {
					x: PADDING,
					y: vh - mainSize.height - equalizerSize.height - playlistSize.height - PADDING * 3
				},
				equalizer: { x: PADDING, y: vh - mainSize.height - equalizerSize.height - PADDING * 2 },
				main: { x: PADDING, y: vh - mainSize.height - PADDING },
				milkdrop: { x: vw - milkdropSize.width - PADDING, y: vh - milkdropSize.height - PADDING }
			};
		} else {
			// stacked: playlist+equalizer left | main (above milkdrop) + milkdrop right
			const rightX = vw - milkdropSize.width - PADDING;
			return {
				equalizer: { x: PADDING, y: vh - equalizerSize.height - PADDING },
				playlist: { x: PADDING, y: vh - equalizerSize.height - playlistSize.height - PADDING * 2 },
				main: {
					x: rightX + Math.floor((milkdropSize.width - mainSize.width) / 2),
					y: vh - milkdropSize.height - mainSize.height - PADDING * 2
				},
				milkdrop: { x: rightX, y: vh - milkdropSize.height - PADDING }
			};
		}
	}

	function updateWindowLayout(): void {
		const webamp = getWebamp();
		if (!webamp) {
			return;
		}

		const vw = width.value;
		const vh = height.value;

		if (webamp.store.getState().display.doubled !== isDoubleSizeLayout()) {
			webamp.store.dispatch({ type: 'TOGGLE_DOUBLESIZE_MODE' });
		}

		const sizes = calculateWindowSizes(vw, vh);
		webamp.store.dispatch({
			type: 'WINDOW_SIZE_CHANGED',
			windowId: 'milkdrop',
			size: [sizes.milkdrop.extraWidth, sizes.milkdrop.extraHeight]
		});
		webamp.store.dispatch({
			type: 'WINDOW_SIZE_CHANGED',
			windowId: 'playlist',
			size: [sizes.playlist.extraWidth, sizes.playlist.extraHeight]
		});

		const positions = calculatePositions(vw, vh, webamp.store.getState());
		webamp.store.dispatch({ type: 'UPDATE_WINDOW_POSITIONS', absolute: true, positions });

		if (container.value) {
			container.value.style.visibility = 'visible';
		}
	}

	const debouncedUpdateLayout = useDebounceFn(updateWindowLayout, 100);

	watch([width, height], () => {
		const webamp = getWebamp();
		if (webamp && container.value) {
			container.value.style.visibility = 'hidden';
		}
		void debouncedUpdateLayout();
	});

	function getInitialWindowSizes(): { milkdrop: WindowSize; playlist: WindowSize } {
		return calculateWindowSizes(width.value, height.value);
	}

	return { getInitialWindowSizes, isDoubleSizeLayout, updateWindowLayout };
}
