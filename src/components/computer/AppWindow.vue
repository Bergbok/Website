<script setup lang="ts">
import Icon from '@compunents/Icon.vue';
import { Window } from '@os-gui';
import { useWmStore } from '@store/wm.ts';
import { get, useEventBus } from '@vueuse/core';
import { appOpenBus } from '@composables/useApp.ts';
import { getApp, getIcon, getIconShader, getLabel } from '@components/computer/apps';
import { computed, inject, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';
import type { Neon } from 'shaders/vue';
import type { AppID } from '@components/computer/apps';
import type WindowComponent from '@compunents/os-gui/Window.vue';

const {
	appID,
	icon: iconProp,
	link,
	shaderOptions
} = defineProps<{
	appID: AppID;
	icon?: string;
	/** forwarded to Icon for link/utility apps. */
	link?: string | null;
	/** forwarded to Icon for shader effects. */
	shaderOptions?: InstanceType<typeof Neon>['$props'];
}>();

const emit = defineEmits<{
	open: [];
	close: [];
}>();

defineSlots<{ default?: () => unknown; menubar?: () => unknown }>();

const entry = getApp(appID);
const persistent = entry.persistent ?? false;
const iconFromEntry = getIcon(entry);
const shaderFromEntry = getIconShader(entry);
const appIcon = iconProp ?? iconFromEntry;
const iconShaderOptions = shaderOptions ?? shaderFromEntry;
const appLink = link ?? entry.link;
const isLinkApp = typeof appLink === 'string';
const wm = useWmStore();
const iconLabel = getLabel(entry, 'icon');
const windowLabel = getLabel(entry, 'window');

const isRouted = inject<boolean>('app-routed', false);
const routedAppID = inject<AppID | null>('app-routed-id', null);
const isRoutedTarget = isRouted && routedAppID === appID;

const windowRef = useTemplateRef<InstanceType<typeof WindowComponent>>('windowRef');
const isOpen = ref(false);
const hasOpened = ref(false);

function open(options: { maximize?: boolean } = {}): void {
	const win = get(windowRef);
	if (win) {
		if (win.isMinimized) {
			win.doMinimize();
			win.bringToFront();
			return;
		}
		if (get(isOpen)) {
			if (options.maximize && !win.isMaximized) {
				win.doMaximize();
			}
			win.bringToFront();
			return;
		}
	}
	if (persistent) {
		hasOpened.value = true;
	}
	isOpen.value = true;
	emit('open');
	if (options.maximize) {
		nextTick(() => {
			const w = get(windowRef);
			if (w && !w.isMaximized) {
				w.doMaximize();
			}
		});
	}
}

function close(): void {
	isOpen.value = false;
	emit('close');
}

watch(isOpen, (nowOpen) => {
	if (nowOpen) {
		nextTick(() => get(windowRef)?.bringToFront?.());
	}
});

useEventBus(appOpenBus).on((req) => {
	if (req.appID === appID) {
		open({ maximize: req.maximize });
	}
});

if (isRoutedTarget) {
	onMounted(() => open({ maximize: true }));
}

const showsWindow = computed(() => !isLinkApp && (persistent ? get(hasOpened) : get(isOpen)));

const savedGeo = computed(() => wm.geometry[appID]);
const initialW = computed(() => get(savedGeo)?.w || entry.position.width || 400);
const initialH = computed(() => get(savedGeo)?.h || entry.position.height || 300);
const initialX = computed(() => get(savedGeo)?.x ?? entry.position.initialX);
const initialY = computed(() => get(savedGeo)?.y ?? entry.position.initialY);
const initialMaximized = computed(() => get(savedGeo)?.maximized ?? entry.position.maximized ?? false);

defineExpose({ open, close, isOpen, hasOpened });
</script>

<template>
	<Icon
		v-if="!isRouted"
		:id="appID"
		:label="iconLabel"
		:icon="appIcon"
		:link="appLink"
		:shader-options="iconShaderOptions"
		@open="open()" />

	<Teleport v-if="showsWindow" defer to="#screen">
		<div v-show="!persistent || isOpen" style="display: contents">
			<Window
				ref="windowRef"
				:app-i-d="appID"
				:label="windowLabel"
				:icon="appIcon"
				:visible="!persistent || isOpen"
				:width="initialW"
				:height="initialH"
				:initial-x="initialX"
				:initial-y="initialY"
				:maximized="initialMaximized"
				:min-width="entry.position.minWidth"
				:min-height="entry.position.minHeight"
				:resizable="entry.position.resizable ?? true"
				:tool-window="entry.position.toolWindow ?? false"
				:minimize-button="entry.position.minimizeButton ?? true"
				:maximize-button="entry.position.maximizeButton ?? true"
				:close-button="entry.position.closeButton ?? true"
				@close="close">
				<template v-if="$slots.menubar" #menubar><slot name="menubar" /></template>
				<slot />
			</Window>
		</div>
	</Teleport>
</template>

<style scoped></style>
