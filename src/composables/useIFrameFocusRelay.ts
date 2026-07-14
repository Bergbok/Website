import { onMounted } from 'vue';
import { useEventListener, useMutationObserver } from '@vueuse/core';
import type { Ref } from 'vue';

export function useIFrameFocusRelay(windowEl: Ref<HTMLElement | null>, bringToFront: () => void): void {
	function attach(iframe: HTMLIFrameElement): void {
		const inject = (): void => {
			iframe.contentDocument?.addEventListener('pointerdown', bringToFront, { capture: true });
		};
		iframe.addEventListener('load', inject);
		inject();
	}

	useMutationObserver(
		windowEl,
		(records) => {
			for (const r of records) {
				for (const node of r.addedNodes) {
					if (node instanceof HTMLIFrameElement) {
						attach(node);
					} else if (node instanceof HTMLElement) {
						for (const iframe of node.querySelectorAll('iframe')) {
							attach(iframe);
						}
					}
				}
			}
		},
		{ childList: true, subtree: true }
	);

	useEventListener(window, 'blur', () => {
		if (document.activeElement?.tagName === 'IFRAME' && windowEl.value?.contains(document.activeElement)) {
			bringToFront();
		}
	});

	onMounted(() => {
		if (windowEl.value) {
			for (const iframe of windowEl.value.querySelectorAll('iframe')) {
				attach(iframe);
			}
		}
	});
}
