export default function scpBridge(): void {
	const contexts: AudioContext[] = [];
	const URLS = window.SCP_URLS!;
	let muted = false;

	const Native = window.AudioContext || window.webkitAudioContext;
	if (Native) {
		function Patched(this: AudioContext, ...args: ConstructorParameters<typeof AudioContext>): AudioContext {
			const ctx = new Native(...args);
			contexts.push(ctx);
			if (muted) {
				void ctx.suspend();
			}
			return ctx;
		}
		Patched.prototype = Native.prototype;
		for (const k of Object.getOwnPropertyNames(Native)) {
			try {
				(Patched as unknown as Record<string, unknown>)[k] = (Native as unknown as Record<string, unknown>)[k];
			} catch {
				/*_*/
			}
		}
		window.AudioContext = Patched as unknown as typeof AudioContext;
		window.webkitAudioContext = Patched as unknown as typeof AudioContext;
	}

	window.setMuted = (value: boolean): void => {
		muted = value;
		for (const ctx of contexts) {
			try {
				void (muted ? ctx.suspend() : ctx.resume());
			} catch {
				/*_*/
			}
		}
	};

	const canvas = document.getElementById('canvas') as HTMLCanvasElement;

	window.addEventListener('message', (e) => {
		if (e.data === 'scp:resize') {
			window.dispatchEvent(new Event('resize'));
			try {
				canvas.focus({ preventScroll: true });
			} catch {
				canvas.focus();
			}
			canvas.dispatchEvent(new FocusEvent('focus'));
		}
	});

	(window as unknown as { Module: PinballModule }).Module = {
		canvas,
		locateFile: (path: string): string => {
			if (path.endsWith('.wasm')) {
				return URLS.wasm;
			}
			if (path.endsWith('.data')) {
				return URLS.data;
			}
			return path;
		},
		setStatus: (text?: string): void => {
			if (text === '') {
				parent.postMessage('scp:ready', '*');
			}
		},
		totalDependencies: 0,
		monitorRunDependencies(this: { totalDependencies: number }, remaining?: number): void {
			this.totalDependencies = Math.max(this.totalDependencies, remaining!);
		}
	};

	const script = document.createElement('script');
	script.src = URLS.js;
	document.head.appendChild(script);
}
