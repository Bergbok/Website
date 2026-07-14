import { inject } from 'vue';
import type { GPUComposer } from 'gpu-io';
import type { Ref, ShallowRef } from 'vue';

export interface GpuIOContext {
	composer: Readonly<ShallowRef<GPUComposer | null>>;
	canvas: Readonly<Ref<HTMLCanvasElement | null>>;
	registerLoop: (fn: () => void) => void;
	unregisterLoop: () => void;
	onResize: (fn: () => void) => void;
}

export function useGpuIO(): GpuIOContext {
	const composer = inject<ShallowRef<GPUComposer | null>>('gpuio-composer');
	const canvas = inject<Ref<HTMLCanvasElement | null>>('gpuio-canvas');
	const registerLoop = inject<(fn: () => void) => void>('gpuio-registerLoop');
	const unregisterLoop = inject<() => void>('gpuio-unregisterLoop');
	const onResize = inject<(fn: () => void) => void>('gpuio-onResize');

	if (!composer || !canvas || !registerLoop || !unregisterLoop || !onResize) {
		throw new Error('useGpuIO() must be used inside a <GpuWindow> component tree');
	}

	return { composer, canvas, registerLoop, unregisterLoop, onResize };
}
