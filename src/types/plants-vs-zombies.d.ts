interface PvzModule {
	canvas: HTMLCanvasElement;
	print(...args: any[]): void;
	printErr(...args: any[]): void;
	locateFile(path: string): string;
	setStatus(): void;
	monitorRunDependencies(): void;
	onAbort(reason: string): void;
	preRun: (() => void)[];
	onRuntimeInitialized(): void;
	addRunDependency(id: string): void;
	removeRunDependency(id: string): void;
	FS: any;
	IDBFS: any;
	_pvz_set_timescale?: (value: number) => void;
}

interface PvzUrls {
	js: string;
	data: string;
	wasm: string;
}

interface PvzBus {
	on(listener: (event: PvzBridgeMessage) => void): () => void;
	off(listener: (event: PvzBridgeMessage) => void): void;
	emit(event: PvzBridgeMessage): void;
	reset(): void;
}

type PvzBridgeMessage =
	| { type: 'pvz:ready' }
	| { type: 'pvz:saved' }
	| { type: 'pvz:export-result'; filename: string; blob: Blob }
	| { type: 'pvz:imported'; count: number }
	| { type: 'pvz:error'; message: string }
	| { type: 'pvz:speed'; value: number }
	| { type: 'pvz:muted'; value: boolean }
	| { type: 'pvz:save' }
	| { type: 'pvz:export' }
	| { type: 'pvz:import'; files: File[] }
	| { type: 'pvz:clean' };

interface Window {
	PVZ_URLS?: PvzUrls;
	Module: PvzModule;
	PVZ: {
		requestSave(): void;
		flushSave(): void;
	};
	AudioContext?: typeof AudioContext;
	webkitAudioContext?: typeof AudioContext;
	$pvzBus?: PvzBus;
}
