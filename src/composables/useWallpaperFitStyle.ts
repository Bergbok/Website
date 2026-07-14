import { computed, toValue } from 'vue';
import type { WallpaperFit } from '@store/settings.ts';
import type { ComputedRef, MaybeRefOrGetter } from 'vue';

export type WallpaperFitStyle = Record<string, string>;

export function wallpaperFitToStyle(fit: WallpaperFit): WallpaperFitStyle {
	switch (fit) {
		case 'contain': {
			return { backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' };
		}
		case 'fill': {
			return { backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' };
		}
		case 'center': {
			return { backgroundSize: 'auto', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' };
		}
		case 'tile': {
			return { backgroundSize: 'auto', backgroundRepeat: 'repeat' };
		}
		default: {
			return { backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' };
		}
	}
}

export function useWallpaperFitStyle(fit: MaybeRefOrGetter<WallpaperFit>): ComputedRef<WallpaperFitStyle> {
	return computed(() => wallpaperFitToStyle(toValue(fit)));
}
