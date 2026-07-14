import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';

export type WallpaperFit = 'cover' | 'contain' | 'fill' | 'center' | 'tile';

export const useSettingsStore = defineStore('settings', () => {
	const accentColor = useLocalStorage('settings:accentColor', '#212121');
	const enableShaders = useLocalStorage('settings:enableShaders', true);
	const enableNeonIcons = useLocalStorage('settings:enableNeonIcons', true);
	const enableIconLabels = useLocalStorage('settings:enableIconLabels', true);

	const background = useLocalStorage('settings:background', 2);
	const backgroundFit = useLocalStorage<WallpaperFit>('settings:backgroundFit', 'cover');
	const enableBackgroundShader = useLocalStorage('settings:enableBackgroundShader', true);
	const customBackgroundUrl = useLocalStorage<string | null>('settings:customBackgroundUrl', null);

	const wallpaper = useLocalStorage('settings:wallpaper', 1);
	const wallpaperFit = useLocalStorage<WallpaperFit>('settings:wallpaperFit', 'cover');
	const enableWallpaperShader = useLocalStorage('settings:enableWallpaperShader', false);
	const customWallpaperUrl = useLocalStorage<string | null>('settings:customWallpaperUrl', null);

	const title = useLocalStorage(
		'settings:title',
		window.location.hostname === 'localhost' ? 'localhost' : 'hello, computer user'
	);

	function resetToDefaults(): void {
		accentColor.value = '#000080';
		background.value = 2;
		backgroundFit.value = 'cover';
		customBackgroundUrl.value = null;
		customWallpaperUrl.value = null;
		enableBackgroundShader.value = true;
		enableIconLabels.value = true;
		enableNeonIcons.value = true;
		enableShaders.value = true;
		enableWallpaperShader.value = false;
		title.value = window.location.hostname === 'localhost' ? 'localhost' : 'hello, computer user';
		wallpaper.value = 1;
		wallpaperFit.value = 'cover';
	}

	return {
		accentColor,
		background,
		backgroundFit,
		customBackgroundUrl,
		customWallpaperUrl,
		enableBackgroundShader,
		enableIconLabels,
		enableNeonIcons,
		enableShaders,
		enableWallpaperShader,
		title,
		wallpaper,
		wallpaperFit,
		resetToDefaults
	};
});
