interface PinballModule {
	canvas: HTMLCanvasElement;
	locateFile(path: string): string;
	setStatus(text?: string): void;
	totalDependencies: number;
	monitorRunDependencies(this: { totalDependencies: number }, remaining?: number): void;
}

interface PinballUrls {
	js: string;
	data: string;
	wasm: string;
}

interface Window {
	SCP_URLS?: PinballUrls;
	setMuted?: (muted: boolean) => void;
	AudioContext?: typeof AudioContext;
	webkitAudioContext?: typeof AudioContext;
}
