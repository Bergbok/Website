import { useWmStore } from '@store/wm.ts';
import { useEventBus } from '@vueuse/core';
import { onUnmounted, ref, watch } from 'vue';
import { getApp, getIcon, getLabel } from '@components/computer/apps';
import type { Ref } from 'vue';
import type { EventBusKey } from '@vueuse/core';
import type { AppID } from '@components/computer/apps';

export interface OpenAppRequest {
	appID: AppID;
	maximize?: boolean;
}

export const appOpenBus: EventBusKey<OpenAppRequest> = Symbol('app-open');

export interface UseAppReturn {
	open: (options?: Omit<OpenAppRequest, 'appID'>) => void;
	close: () => void;
	isOpen: () => boolean;
}

export function useApp(appID: AppID): UseAppReturn {
	const bus = useEventBus(appOpenBus);
	const wm = useWmStore();
	return {
		open: (options = {}) => bus.emit({ appID, ...options }),
		close: () => {
			const rec = wm.findByApp(appID);
			if (rec) {
				wm.unregister(rec.id);
			}
		},
		isOpen: () => wm.findByApp(appID) !== null
	};
}

export interface UseAppOpen {
	/** reactive open state, mirrored from AppWindow's open/close events */
	isOpen: Ref<boolean>;
	/** spread onto `<AppWindow v-on="...">` to keep `isOpen` in sync */
	appOpenListeners: { open: () => void; close: () => void };
}

export function useAppOpen(): UseAppOpen {
	const isOpen = ref(false);
	return {
		isOpen,
		appOpenListeners: {
			open: (): void => {
				isOpen.value = true;
			},
			close: (): void => {
				isOpen.value = false;
			}
		}
	};
}

interface UseExternalizedAppOptions {
	isOpen: Ref<boolean>;
	isMinimized: Ref<boolean>;
	/** invoked when the taskbar requests a minimize-toggle */
	onTaskbarToggle: () => void;
}

export function useExternalizedApp(appID: AppID, opts: UseExternalizedAppOptions): void {
	const wm = useWmStore();
	const entry = getApp(appID);
	let recordID: string | null = null;

	const ensureRegistered = (): void => {
		if (recordID === null && opts.isOpen.value) {
			const rec = wm.register(appID, getLabel(entry, 'window'), getIcon(entry));
			rec.onTaskbarToggle = (): void => opts.onTaskbarToggle();
			recordID = rec.id;
		}
	};
	const ensureUnregistered = (): void => {
		if (recordID !== null) {
			wm.unregister(recordID);
			recordID = null;
		}
	};

	watch(
		() => opts.isOpen.value,
		(nowOpen) => {
			if (nowOpen) {
				ensureRegistered();
			} else {
				ensureUnregistered();
			}
		},
		{ immediate: true }
	);

	watch(
		() => opts.isMinimized.value,
		(val) => {
			if (recordID !== null) {
				wm.setMinimized(recordID, val);
			}
		}
	);

	onUnmounted(ensureUnregistered);
}
