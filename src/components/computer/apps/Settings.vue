<script setup lang="ts">
import 'vue-color/style.css';
import AppWindow from '@compunents/AppWindow.vue';
import shapeSdfUrl from '@assets/images/sdf/pixel-icons/cog-solid.bin?url';
import { ChromePicker } from 'vue-color';
import { useWmStore } from '@store/wm.ts';
import { Button, MenuBar } from '@os-gui';
import { ref, useTemplateRef } from 'vue';
import { useDesktopStore } from '@store/desktop.ts';
import { useSettingsStore } from '@store/settings.ts';
import { BACKDROPS, CUSTOM_BACKDROP } from '@components/shaders';
import { wallpaperFitToStyle } from '@composables/useWallpaperFitStyle.ts';
import { get, onClickOutside, useDropZone, useFileDialog } from '@vueuse/core';
import type { MaybeRefOrGetter, Ref } from 'vue';
import type { BackdropPreset } from '@components/shaders';
import type { WallpaperFitStyle } from '@composables/useWallpaperFitStyle.ts';

type ImageTarget = 'wallpaper' | 'background';

const appWindowRef = useTemplateRef<InstanceType<typeof AppWindow>>('appWindow');
function close(): void {
	get(appWindowRef)?.close();
}

const settings = useSettingsStore();

const accentPickerOpen = ref(false);
const accentPickerWrapper = useTemplateRef<HTMLElement>('accentPickerWrapper');
onClickOutside(accentPickerWrapper, (): void => {
	accentPickerOpen.value = false;
});

async function applyCustomImage(file: File, target: ImageTarget): Promise<void> {
	const bytes = new Uint8Array(await file.arrayBuffer());
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	const url = `data:${file.type};base64,${btoa(binary)}`;
	if (target === 'wallpaper') {
		settings.customWallpaperUrl = url;
		settings.wallpaper = CUSTOM_BACKDROP;
	} else {
		settings.customBackgroundUrl = url;
		settings.background = CUSTOM_BACKDROP;
	}
}

function useImageDrop(
	targetRef: MaybeRefOrGetter<HTMLElement | null | undefined>,
	droppedTarget: ImageTarget
): Ref<boolean> {
	const { isOverDropZone } = useDropZone(targetRef, {
		dataTypes: (types) => types.some((t) => t.startsWith('image/')),
		onDrop(files): void {
			if (files?.[0]) {
				applyCustomImage(files[0], droppedTarget);
			}
		}
	});
	return isOverDropZone;
}

const customBackgroundRef = useTemplateRef<HTMLElement>('customBg');
const customWallpaperRef = useTemplateRef<HTMLElement>('customWp');
const isOverCustomBackground = useImageDrop(customBackgroundRef, 'background');
const isOverCustomWallpaper = useImageDrop(customWallpaperRef, 'wallpaper');

const { open: openWallpaperDialog, onChange: onWallpaperChange } = useFileDialog({
	accept: 'image/*',
	multiple: false,
	reset: true
});
onWallpaperChange((files): void => {
	if (files?.[0]) {
		applyCustomImage(files[0], 'wallpaper');
	}
});

const { open: openBackgroundDialog, onChange: onBackgroundChange } = useFileDialog({
	accept: 'image/*',
	multiple: false,
	reset: true
});
onBackgroundChange((files): void => {
	if (files?.[0]) {
		applyCustomImage(files[0], 'background');
	}
});

function handleCustomClick(target: ImageTarget): void {
	if (target === 'wallpaper') {
		settings.wallpaper = CUSTOM_BACKDROP;
		openWallpaperDialog();
	} else {
		settings.background = CUSTOM_BACKDROP;
		openBackgroundDialog();
	}
}

function applyBackdrop(preset: BackdropPreset, presetID: number, target: ImageTarget): void {
	if (target === 'wallpaper') {
		settings.wallpaper = presetID;
		if (preset.fallback.fit) {
			settings.wallpaperFit = preset.fallback.fit;
		}
	} else {
		settings.background = presetID;
		if (preset.fallback.fit) {
			settings.backgroundFit = preset.fallback.fit;
		}
	}
}

function fitStyleFor(target: ImageTarget, preset?: BackdropPreset): WallpaperFitStyle {
	return wallpaperFitToStyle(
		preset?.fallback.fit ?? (target === 'wallpaper' ? settings.wallpaperFit : settings.backgroundFit)
	);
}

function resetAll(): void {
	settings.resetToDefaults();
	useDesktopStore().resetToDefaults();
	useWmStore().resetToDefaults();
	window.location.reload();
}

const menus: OSGUITopLevelMenus = {
	'&File': [{ label: 'E&xit', action: close }],
	'&Help': [
		{
			label: '&no elp'
		}
	]
};
</script>

<template>
	<AppWindow ref="appWindow" app-i-d="settings" :shader-options="{ shapeSdfUrl }">
		<template #menubar>
			<MenuBar :menus="menus" />
		</template>
		<div class="body">
			<fieldset class="group">
				<legend>Page Title</legend>
				<div class="setting-row">
					<input type="text" v-model="settings.title" class="title-input" />
				</div>
			</fieldset>

			<fieldset class="group display-group">
				<legend>Display</legend>
				<div class="display-top-row">
					<label class="setting-row">
						<input type="checkbox" v-model="settings.enableIconLabels" />
						Icon Labels
					</label>
					<div ref="accentPickerWrapper" class="accent-picker-wrapper">
						<div class="setting-row accent-swatch-row" @click="accentPickerOpen = !accentPickerOpen">
							<div class="accent-swatch" :style="{ background: settings.accentColor }" />
							Accent color
						</div>
						<ChromePicker
							v-if="accentPickerOpen"
							v-model="settings.accentColor"
							:disable-alpha="true"
							class="color-picker" />
					</div>
				</div>
				<fieldset class="shaders">
					<legend>Shaders</legend>
					<div class="controls">
						<label class="setting-row">
							<input type="checkbox" v-model="settings.enableShaders" />
							Enabled
						</label>
						<label class="setting-row">
							<input
								type="checkbox"
								v-model="settings.enableNeonIcons"
								:disabled="!settings.enableShaders" />
							Icons
						</label>
						<label class="setting-row">
							<input
								type="checkbox"
								v-model="settings.enableWallpaperShader"
								:disabled="!settings.enableShaders" />
							Wallpaper
						</label>
						<label class="setting-row">
							<input
								type="checkbox"
								v-model="settings.enableBackgroundShader"
								:disabled="!settings.enableShaders" />
							Background
						</label>
					</div>
				</fieldset>
				<div class="fit-row">
					<div class="fit-col">
						<label for="wallpaper-fit" class="fit-label">Wallpaper fit</label>
						<select id="wallpaper-fit" v-model="settings.wallpaperFit" class="fit-select">
							<option value="cover">Cover</option>
							<option value="contain">Contain</option>
							<option value="fill">Stretch</option>
							<option value="center">Center</option>
							<option value="tile">Tile</option>
						</select>
					</div>
					<div class="fit-col">
						<label for="background-fit" class="fit-label">Background fit</label>
						<select id="background-fit" v-model="settings.backgroundFit" class="fit-select">
							<option value="cover">Cover</option>
							<option value="contain">Contain</option>
							<option value="fill">Stretch</option>
							<option value="center">Center</option>
							<option value="tile">Tile</option>
						</select>
					</div>
				</div>
				<div class="grid">
					<button class="btn" title="Custom image">
						<div class="thumb">
							<div class="full backdrop-off" />
							<div
								v-if="settings.customBackgroundUrl"
								class="zone-overlay zone-bg"
								:style="{
									backgroundImage: `url(${settings.customBackgroundUrl})`,
									...fitStyleFor('background')
								}" />
							<div
								v-if="settings.customWallpaperUrl"
								class="zone-overlay zone-wp"
								:style="{
									backgroundImage: `url(${settings.customWallpaperUrl})`,
									...fitStyleFor('wallpaper')
								}" />
							<div
								ref="customBg"
								class="click-zone click-bg"
								:class="{
									'selected': settings.background === CUSTOM_BACKDROP,
									'drop-over': isOverCustomBackground
								}"
								@click="handleCustomClick('background')"
								title="Drop image or click to upload Background" />
							<div
								ref="customWp"
								class="click-zone click-wp"
								:class="{
									'selected': settings.wallpaper === CUSTOM_BACKDROP,
									'drop-over': isOverCustomWallpaper
								}"
								@click.stop="handleCustomClick('wallpaper')"
								title="Drop image or click to upload Wallpaper" />
							<div class="custom-upload-hint" aria-hidden="true">+</div>
						</div>
					</button>
					<button v-for="(preset, index) in BACKDROPS" :key="String(index + 1)" class="btn">
						<div class="thumb">
							<component
								v-if="
									settings.enableShaders &&
									(settings.enableWallpaperShader || settings.enableBackgroundShader)
								"
								:is="preset.shader"
								class="full" />
							<div
								v-if="
									!settings.enableShaders ||
									(!settings.enableWallpaperShader && !settings.enableBackgroundShader)
								"
								class="full"
								:style="{
									backgroundImage: `url(${preset.fallback.src})`,
									...fitStyleFor('wallpaper', preset)
								}" />
							<div
								v-if="settings.enableShaders && !settings.enableWallpaperShader"
								class="zone-overlay zone-wp"
								:style="{
									backgroundImage: `url(${preset.fallback.src})`,
									...fitStyleFor('wallpaper', preset)
								}" />
							<div
								v-if="settings.enableShaders && !settings.enableBackgroundShader"
								class="zone-overlay zone-bg"
								:style="{
									backgroundImage: `url(${preset.fallback.src})`,
									...fitStyleFor('background', preset)
								}" />
							<div
								class="click-zone click-bg"
								:class="{ selected: index + 1 === settings.background }"
								@click="applyBackdrop(preset, index + 1, 'background')"
								title="Set as Background" />
							<div
								class="click-zone click-wp"
								:class="{ selected: index + 1 === settings.wallpaper }"
								@click.stop="applyBackdrop(preset, index + 1, 'wallpaper')"
								title="Set as Wallpaper" />
						</div>
					</button>
				</div>
			</fieldset>

			<div class="footer">
				<Button @click="resetAll">Reset</Button>
				<div class="spacer" />
				<Button variant="default" @click="close">OK</Button>
				<Button @click="close">Cancel</Button>
			</div>
		</div>
	</AppWindow>
</template>

<style scoped>
.vc-chrome-picker :deep(.body) {
	background-color: rgb(192, 192, 192);
}

.body {
	padding: 6px 8px 8px;
	display: flex;
	flex-direction: column;
	gap: 4px;
	box-sizing: border-box;
	height: 100%;
	overflow-y: auto;

	& .group {
		font-size: 11px;
		border: 1px solid var(--ButtonShadow, #808080);
		padding: 2px 8px 6px;

		& legend {
			font-size: 11px;
			padding: 0 2px;
		}

		& input[type='checkbox'] {
			margin: 0;
		}
	}

	& .display-group {
		flex: 1;
	}

	& .display-top-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3px 8px;
		align-items: center;
		margin-bottom: 4px;

		& .setting-row input[type='checkbox'] {
			margin-left: 7px;
		}
	}

	& .fit-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3px 8px;
		align-items: center;
		margin-bottom: 6px;
	}

	& .shaders {
		font-size: 11px;
		border: 1px solid var(--ButtonShadow, #808080);
		padding: 2px 6px 4px;
		margin: 0 0 4px;

		& legend {
			font-size: 11px;
			padding: 0 2px;
		}

		& input[type='checkbox'] {
			margin: 0;
		}
	}

	& .controls {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3px 8px;
		align-items: center;
	}

	& .setting-row {
		display: flex;
		align-items: center;
		gap: 5px;
		margin: 3px 0;
		cursor: default;
		font-size: 11px;

		&.accent-swatch-row {
			cursor: pointer;
		}
	}

	& .title-input {
		width: 100%;
		box-sizing: border-box;
		margin: 3px 0;
	}

	& .fit-col {
		display: flex;
		flex-direction: column;
		gap: 2px;

		& .fit-label {
			font-size: 11px;
			white-space: nowrap;
		}

		& .fit-select {
			font-size: 11px;
			width: 100%;
		}
	}

	& .grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;

		& .btn {
			position: relative;
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 2px;
			background: var(--ButtonFace, #c0c0c0);
			border: 2px solid var(--ButtonShadow, #808080);
			cursor: pointer;
			overflow: hidden;

			&:hover {
				border-color: var(--ButtonText, #000);
			}
		}

		& .thumb {
			position: relative;
			width: 100%;
			aspect-ratio: 1;
			overflow: hidden;
		}

		& .full {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
			display: block;
			background-size: cover;
			background-position: center;
		}

		& .backdrop-off {
			background: repeating-linear-gradient(-45deg, #aaa 0px, #aaa 2px, #ccc 2px, #ccc 8px);
		}

		& .zone-overlay {
			position: absolute;
			inset: 0;
			background-position: center;
			pointer-events: none;
		}

		& .zone-wp {
			left: 15%;
			right: 15%;
		}

		& .zone-bg {
			mask-image: linear-gradient(to right, #000 15%, transparent 15%, transparent 85%, #000 85%);
			-webkit-mask-image: linear-gradient(to right, #000 15%, transparent 15%, transparent 85%, #000 85%);
		}

		& .click-zone {
			position: absolute;
		}

		& .click-bg {
			inset: 0;
			z-index: 2;

			&::before,
			&::after {
				content: '';
				position: absolute;
				inset: 0;
				pointer-events: none;
			}

			&::before {
				right: 85%;
			}

			&::after {
				left: 85%;
			}

			&:hover::before,
			&:hover::after {
				background: rgba(100, 149, 237, 0.12);
			}
		}

		& .click-bg.selected {
			box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.85);
		}

		& .click-bg.drop-over {
			&::before,
			&::after {
				background: rgba(100, 149, 237, 0.22);
				box-shadow: inset 0 0 0 2px rgba(100, 149, 237, 0.55);
			}
		}

		& .click-wp {
			inset: 0 15%;
			z-index: 3;
			box-shadow:
				inset 1px 0 0 rgba(255, 255, 255, 0.18),
				inset -1px 0 0 rgba(255, 255, 255, 0.18);

			&:hover {
				background: rgba(255, 255, 255, 0.12);
			}
		}

		& .click-wp.selected {
			box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.85);
		}

		& .click-wp.drop-over {
			background: rgba(255, 255, 255, 0.22);
			box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.55);
		}

		& .custom-upload-hint {
			position: absolute;
			inset: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 16px;
			color: rgba(255, 255, 255, 0.55);
			pointer-events: none;
			user-select: none;
			z-index: 1;
		}
	}

	& .accent-swatch {
		width: 13px;
		height: 13px;
		border: 1px solid var(--ButtonShadow, #808080);
		box-shadow:
			inset -1px -1px 0 #fff,
			inset 1px 1px 0 #404040;
		flex-shrink: 0;
	}

	& .accent-picker-wrapper {
		position: relative;
	}

	& .color-picker {
		position: absolute;
		top: 100%;
		left: 0;
		z-index: 100;
		width: 100% !important;
		box-shadow: none !important;
		margin: 4px 0;
	}

	& .footer {
		display: flex;
		justify-content: flex-end;
		gap: 4px;
		margin-top: auto;
		padding-top: 4px;

		& .spacer {
			flex: 1;
		}
	}
}
</style>
