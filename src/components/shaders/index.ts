import black from '@assets/images/wallpapers/black.avif';
import stars1 from '@assets/images/wallpapers/stars-1.gif';
import stars2 from '@assets/images/wallpapers/stars-2.gif';
import stars3 from '@assets/images/wallpapers/stars-3.gif';
import stars4 from '@assets/images/wallpapers/stars-4.avif';
import water1 from '@assets/images/wallpapers/water-1.gif';
import water2 from '@assets/images/wallpapers/water-2.gif';
import water3 from '@assets/images/wallpapers/water-3.gif';
import water4 from '@assets/images/wallpapers/water-4.gif';
import bliss from '@assets/images/wallpapers/xp-bliss.avif';
import win7beach from '@assets/images/wallpapers/win7-beach.avif';
import { defineAsyncComponent } from 'vue';
import type { Component } from 'vue';
import type { WallpaperFit } from '@store/settings.ts';

export interface BackdropPreset {
	/** should have a <slot /> */
	shader: Component;
	/** fallback image for when backdrops are disabled */
	fallback: {
		src: string;
		fit?: WallpaperFit;
	};
}

export const BACKDROPS: BackdropPreset[] = [
	{
		shader: defineAsyncComponent(async () => import('@components/shaders/presets/LavaLamp3.vue')),
		fallback: { src: bliss, fit: 'fill' }
	},
	{
		shader: defineAsyncComponent(async () => import('@components/shaders/presets/IlluminatedClouds1.vue')),
		fallback: { src: win7beach, fit: 'cover' }
	},
	{
		shader: defineAsyncComponent(async () => import('@components/shaders/presets/PaintFlow7.vue')),
		fallback: { src: black, fit: 'cover' }
	},
	{
		shader: defineAsyncComponent(async () => import('@components/shaders/presets/Quantum2.vue')),
		fallback: { src: water1, fit: 'tile' }
	},
	{
		shader: defineAsyncComponent(async () => import('@components/shaders/presets/LightLeaks1.vue')),
		fallback: { src: water2, fit: 'tile' }
	},
	{
		shader: defineAsyncComponent(async () => import('@components/shaders/presets/PaintFlow3.vue')),
		fallback: { src: water3, fit: 'tile' }
	},
	{
		shader: defineAsyncComponent(async () => import('@components/shaders/presets/Quantum2.vue')),
		fallback: { src: water4, fit: 'tile' }
	},
	{
		shader: defineAsyncComponent(async () => import('@components/shaders/presets/LiquidCells5.vue')),
		fallback: { src: stars1, fit: 'tile' }
	},
	{
		shader: defineAsyncComponent(async () => import('@components/shaders/presets/Smokescreen1.vue')),
		fallback: { src: stars3, fit: 'tile' }
	},
	{
		shader: defineAsyncComponent(async () => import('@components/shaders/presets/FlowingDots2.vue')),
		fallback: { src: stars2, fit: 'tile' }
	},
	{
		shader: defineAsyncComponent(async () => import('@components/shaders/presets/BadSignal1.vue')),
		fallback: { src: stars4, fit: 'tile' }
	}
];

export const CUSTOM_BACKDROP = 0;

export function getBackdrop(id: number): BackdropPreset {
	return BACKDROPS[id - 1] ?? BACKDROPS[0]!;
}
