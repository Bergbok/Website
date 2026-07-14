import type { EventBusKey } from '@vueuse/core';

export const pvzBridgeKey: EventBusKey<PvzBridgeMessage> = Symbol('pvz-bridge');

export function pvzBridge(): void {
	const SAVE_DIR = '/savedata';
	const CACHE_DIR = '/compiled';

	const URLS = window.PVZ_URLS!;
	const bus = parent.window.$pvzBus;
	if (!bus) {
		console.error('PvZ event bus not available on parent window');
	}

	const Native = window.AudioContext || window.webkitAudioContext;
	const contexts: AudioContext[] = [];
	let muted = false;

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

	function setMuted(value: boolean): void {
		muted = value;
		for (const ctx of contexts) {
			try {
				void (muted ? ctx.suspend() : ctx.resume());
			} catch {
				/*_*/
			}
		}
	}

	for (const evt of ['pointerdown', 'keydown', 'touchstart', 'click']) {
		window.addEventListener(
			evt,
			() => {
				for (const ctx of contexts) {
					try {
						if (!muted && ctx.state === 'suspended') {
							void ctx.resume();
						}
					} catch {
						/*_*/
					}
				}
			},
			{ passive: true, capture: true }
		);
	}

	const canvas = document.getElementById('canvas') as HTMLCanvasElement;
	canvas.addEventListener('contextmenu', (e) => e.preventDefault());

	let ready = false;
	let speed = 1;
	let pendingSave = false;
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	function applySpeed(value: number): void {
		if (ready && window.Module._pvz_set_timescale) {
			window.Module._pvz_set_timescale(value);
		}
	}

	function flushSave(): void {
		if (!pendingSave || !ready) {
			return;
		}
		pendingSave = false;
		window.Module.FS.syncfs(false, (err: unknown) => {
			if (err) {
				console.warn('save sync:', err);
			} else {
				bus?.emit({ type: 'pvz:saved' });
			}
		});
	}

	function requestSave(): void {
		pendingSave = true;
		if (saveTimer === null) {
			saveTimer = setTimeout(() => {
				saveTimer = null;
				flushSave();
			}, 800);
		}
	}

	function mkdirP(path: string): void {
		const parts = path.split('/').slice(1, -1);
		let cur = '';
		for (const p of parts) {
			cur += `/${p}`;
			try {
				window.Module.FS.mkdir(cur);
			} catch {
				/*_*/
			}
		}
	}

	function walkFiles(dir: string): string[] {
		const out: string[] = [];
		(function walk(d: string): void {
			let entries: string[] = [];
			try {
				entries = window.Module.FS.readdir(d);
			} catch {
				return;
			}
			for (const name of entries) {
				if (name === '.' || name === '..') {
					continue;
				}
				const p = d.endsWith('/') ? d + name : `${d}/${name}`;
				const stat = window.Module.FS.stat(p);
				if (window.Module.FS.isDir(stat.mode)) {
					walk(p);
				} else if (window.Module.FS.isFile(stat.mode)) {
					out.push(p);
				}
			}
		})(dir);
		return out;
	}

	function exportSaves(): void {
		const enc = new TextEncoder();
		const parts: BlobPart[] = [enc.encode('PVZSAVE').buffer];
		for (const path of walkFiles(SAVE_DIR)) {
			const name = path.slice(SAVE_DIR.length + 1);
			const data: Uint8Array = window.Module.FS.readFile(path);
			const nameBytes = enc.encode(name);
			const header = new ArrayBuffer(8);
			const view = new DataView(header);
			view.setUint32(0, nameBytes.length, true);
			view.setUint32(4, data.length, true);
			parts.push(header, nameBytes.buffer, data.buffer as ArrayBuffer);
		}
		const blob = new Blob(parts, { type: 'application/octet-stream' });
		const filename = `pvz-saves-${new Date().toISOString().replaceAll(/[:.]/g, '-')}.bin`;
		bus?.emit({ type: 'pvz:export-result', filename, blob });
	}

	async function importBin(file: File): Promise<number> {
		const bytes = new Uint8Array(await file.arrayBuffer());
		const dec = new TextDecoder();
		if (dec.decode(bytes.slice(0, 8)) !== 'PVZSAVE') {
			throw new Error('Not a valid PvZ backup .bin file.');
		}
		let off = 8;
		let count = 0;
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		while (off < bytes.length) {
			const nameLen = view.getUint32(off, true);
			off += 4;
			const dataLen = view.getUint32(off, true);
			off += 4;
			const name = dec.decode(bytes.slice(off, off + nameLen));
			off += nameLen;
			const data = bytes.slice(off, off + dataLen);
			off += dataLen;
			const target = `${SAVE_DIR}/${name}`;
			mkdirP(target);
			window.Module.FS.writeFile(target, data);
			count++;
		}
		return count;
	}

	async function importFiles(files: File[]): Promise<void> {
		let count = 0;
		const dats: File[] = [];
		for (const f of files) {
			const name = (f.webkitRelativePath || f.name).split('/').pop() ?? '';
			if (/\.bin$/i.test(name)) {
				try {
					count += await importBin(f);
				} catch (error) {
					bus?.emit({ type: 'pvz:error', message: `Failed to import ${name}: ${(error as Error).message}` });
				}
			} else if (/\.dat$/i.test(name)) {
				dats.push(f);
			}
		}
		for (const f of dats) {
			const name = (f.webkitRelativePath || f.name).split('/').pop() ?? '';
			const bytes = new Uint8Array(await f.arrayBuffer());
			const target = `${SAVE_DIR}/userdata/${name}`;
			mkdirP(target);
			window.Module.FS.writeFile(target, bytes);
			count++;
		}
		if (count > 0) {
			pendingSave = true;
			flushSave();
		}
		bus?.emit({ type: 'pvz:imported', count });
	}

	function wipeAll(): void {
		const dbs = [SAVE_DIR, CACHE_DIR];
		let remaining = dbs.length;
		for (const name of dbs) {
			const req = indexedDB.deleteDatabase(name);
			const done = (): void => {
				if (--remaining === 0) {
					location.reload();
				}
			};
			req.onblocked = done;
			req.onerror = done;
			req.onsuccess = done;
		}
	}

	const Module: PvzModule = {
		canvas,
		print(...args): void {
			console.log(...args);
		},
		printErr(...args): void {
			console.warn(...args);
		},
		locateFile(path: string): string {
			if (path.endsWith('.wasm')) {
				return URLS.wasm;
			}
			if (path.endsWith('.data')) {
				return URLS.data;
			}
			return path;
		},
		setStatus(): void {},
		monitorRunDependencies(): void {},
		addRunDependency: (): void => {},
		removeRunDependency: (): void => {},
		FS: {},
		IDBFS: {},
		onAbort(reason: string): void {
			bus?.emit({ type: 'pvz:error', message: `Aborted: ${reason}` });
		},
		preRun: [
			(): void => {
				for (const dir of [SAVE_DIR, CACHE_DIR]) {
					try {
						Module.FS.mkdir(dir);
					} catch {
						/*_*/
					}
					Module.FS.mount(Module.IDBFS, {}, dir);
				}
				Module.addRunDependency('idbfs-restore');
				Module.FS.syncfs(true, (err: unknown) => {
					if (err) {
						console.warn('IDBFS restore err:', err);
					}
					Module.removeRunDependency('idbfs-restore');
				});
			}
		],
		onRuntimeInitialized(): void {
			ready = true;
			applySpeed(speed);
			setTimeout(() => {
				parent.postMessage('pvz:ready', '*');
				bus?.emit({ type: 'pvz:ready' });
			}, 250);
		}
	};
	window.Module = Module;

	window.PVZ = { requestSave, flushSave };
	window.addEventListener('beforeunload', flushSave);

	bus?.on((msg: PvzBridgeMessage) => {
		switch (msg.type) {
			case 'pvz:speed': {
				speed = msg.value;
				applySpeed(speed);
				break;
			}
			case 'pvz:muted': {
				setMuted(msg.value);
				break;
			}
			case 'pvz:save': {
				pendingSave = true;
				flushSave();
				break;
			}
			case 'pvz:export': {
				try {
					exportSaves();
				} catch (error) {
					bus?.emit({ type: 'pvz:error', message: `Export failed: ${(error as Error).message}` });
				}
				break;
			}
			case 'pvz:import': {
				try {
					void importFiles(msg.files);
				} catch (error) {
					bus?.emit({ type: 'pvz:error', message: `Import failed: ${(error as Error).message}` });
				}
				break;
			}
			case 'pvz:clean': {
				wipeAll();
				break;
			}
			default: {
				break;
			}
		}
	});

	const script = document.createElement('script');
	script.src = URLS.js;
	script.async = true;
	document.head.appendChild(script);
}
