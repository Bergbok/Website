import { useHead } from '@unhead/vue';
import { onMounted, onUnmounted, ref, watchEffect } from 'vue';
import { createSharedComposable, useIntervalFn } from '@vueuse/core';

interface UseFaviconOptions {
	fps?: number;
	frames?: string[];
}

const defaultFrames = Object.values(
	import.meta.glob<string>('@assets/images/favicon/frames/*.png', {
		eager: true,
		import: 'default',
		query: '?inline'
	})
);

const useFaviconSingleton = createSharedComposable((options: UseFaviconOptions) => {
	const baseFrames = ref<string[]>(options.frames ?? defaultFrames);
	const baseFps = ref(options.fps ?? 24);
	const currentFrames = ref<string[]>([...baseFrames.value]);
	const currentFps = ref(baseFps.value);
	const currentFrame = ref(0);

	for (const link of document.querySelectorAll("link[rel='icon']")) {
		link.remove();
	}

	useHead({
		link: [
			{
				rel: 'icon',
				type: 'image/png',
				href: (): string => currentFrames.value[currentFrame.value]!
			}
		]
	});

	const { pause, resume } = useIntervalFn(
		() => {
			currentFrame.value = (currentFrame.value + 1) % currentFrames.value.length;
		},
		() => 1000 / currentFps.value
	);

	watchEffect(() => {
		if (currentFrames.value.length <= 1 || currentFps.value <= 0) {
			pause();
		} else {
			resume();
		}
	});

	function updateFavicon(frames: string[], fps?: number): void {
		currentFrames.value = frames;
		currentFps.value = fps ?? baseFps.value;
		currentFrame.value = 0;
	}

	function resetFavicon(): void {
		currentFrames.value = [...baseFrames.value];
		currentFps.value = baseFps.value;
		currentFrame.value = 0;
	}

	return { updateFavicon, resetFavicon };
});

export function useFavicon(options: UseFaviconOptions = {}): {
	updateFavicon: (frames: string[], fps?: number) => void;
	resetFavicon: () => void;
} {
	const { updateFavicon, resetFavicon } = useFaviconSingleton(options);

	if (options.frames) {
		onMounted(() => updateFavicon(options.frames!, options.fps));
		onUnmounted(resetFavicon);
	}

	return { updateFavicon, resetFavicon };
}
