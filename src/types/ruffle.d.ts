declare module '@ruffle-rs/ruffle';

export interface RuffleConfig {
	allowScriptAccess?: boolean;
	parameters?: null | string | URLSearchParams | Record<string, string>;
	autoplay?: 'on' | 'off' | 'auto';
	backgroundColor?: null | string;
	letterbox?: 'off' | 'fullscreen' | 'on';
	unmuteOverlay?: 'visible' | 'hidden';
	upgradeToHttps?: boolean;
	compatibilityRules?: boolean;
	favorFlash?: boolean;
	warnOnUnsupportedContent?: boolean;
	logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'trace';
	showSwfDownload?: boolean;
	contextMenu?: 'on' | 'rightClickOnly' | 'off';
	preloader?: boolean;
	splashScreen?: boolean;
	maxExecutionDuration?: number | { secs: number; nanos: number };
	base?: null | string;
	menu?: boolean;
	salign?: string;
	forceAlign?: boolean;
	quality?: string;
	scale?: string;
	forceScale?: boolean;
	allowFullscreen?: boolean;
	frameRate?: null | number;
	wmode?: 'window' | 'opaque' | 'transparent' | 'direct' | 'gpu';
	playerVersion?: null | number;
	preferredRenderer?: null | 'webgpu' | 'wgpu-webgl' | 'webgl' | 'canvas';
	publicPath?: null | string;
	polyfills?: boolean;
	openUrlMode?: 'allow' | 'confirm' | 'deny';
	allowNetworking?: 'all' | 'internal' | 'none';
	openInNewTab?: null | ((swf: URL) => void);
	socketProxy?: { host: string; port: number; proxyUrl: string }[];
	fontSources?: string[];
	defaultFonts?: Record<string, string[] | undefined>;
	credentialAllowList?: string[];
	playerRuntime?: 'air' | 'flashPlayer';
}

export interface RufflePlayerElement extends HTMLElement {
	load: (options: { url: string } & RuffleConfig) => Promise<void>;
	onFSCommand: ((command: string, args: string) => boolean) | null;
}

export interface RuffleSource {
	createPlayer: () => RufflePlayerElement;
}

declare global {
	interface Window {
		RufflePlayer: {
			config?: RuffleConfig;
			newest: () => RuffleSource;
		};
	}
}
