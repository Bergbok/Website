<script setup lang="ts">
import Hydra from 'hydra-synth';
import AppWindow from '@compunents/AppWindow.vue';
import { PatchBay } from '@lib/hydra/patch-bay.ts';
import { get, useResizeObserver } from '@vueuse/core';
import { getRandomSketch, getSketch, sketches } from '@lib/hydra/sketches.ts';
import { nextTick, onBeforeUnmount, reactive, useTemplateRef, watch } from 'vue';

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');
const editorRef = useTemplateRef<HTMLTextAreaElement>('editor');
const firstSketch = getRandomSketch();

let instance: Hydra | null = null;
let pb: PatchBay | null = null;

const hydra = reactive({
	code: firstSketch.code,
	editorVisible: true,
	infoVisible: false,
	isError: false,
	isOpen: false,
	sketchIndex: firstSketch.index,
	status: 'ready.',

	network: {
		pbRoomName: '',
		peerCount: 0,
		peers: [] as string[],

		get peerListLabel(): string {
			return this.peers.length === 0 ? 'no peers' : this.peers.join(', ');
		},
		get suggestedPeer(): string {
			return this.peers[0] ?? 'peer name';
		},

		createPatchBay(): PatchBay {
			const bay = new PatchBay();
			bay.on('ready', () => this.refreshPeers());
			bay.on('new peer', () => this.refreshPeers());
			bay.on('peer left', () => this.refreshPeers());
			bay.on('peer-name', () => this.refreshPeers());
			bay.on('stream', (_id, _stream) => {
				this.refreshPeers();
				hydra.setStatus(`receiving stream from ${this.peers.join(', ') || 'peer'}`);
			});
			bay.on('init source', (roomName) => {
				hydra.setStatus(`requesting stream from "${roomName}"...`);
			});
			bay.on('init source failed', (roomName, known) => {
				const list = (known as string[]).filter((n) => n !== bay.roomName);
				hydra.setStatus(
					`no peer named "${roomName}". known room names: ${list.length ? list.join(', ') : '(none - open another tab and click ⇄)'}`,
					true
				);
			});
			return bay;
		},

		refreshPeers(): void {
			if (!pb) {
				this.peers = [];
				this.peerCount = 0;
				return;
			}
			this.peers = pb.list().filter((n) => n !== pb!.roomName);
			this.peerCount = pb.peerIds.size;
		},

		async setName(): Promise<void> {
			if (!instance || !pb) {
				return;
			}
			const bay = pb;
			let suggestion = bay.roomName ?? '';
			while (true) {
				const roomName = globalThis.prompt('patch bay room name:', suggestion);
				if (roomName === null) {
					return;
				}
				const trimmed = roomName.trim();
				if (!trimmed) {
					hydra.setStatus('room name cannot be blank.', true);
					return;
				}
				const result = await bay.setName(trimmed);
				if (result.ok) {
					this.pbRoomName = result.roomName;
					this.refreshPeers();
					hydra.setStatus(
						`broadcasting as "${result.roomName}". others can run: s0.initStream('${result.roomName}'); src(s0).out()`
					);
					return;
				}
				if (result.reason === 'taken') {
					hydra.setStatus(`room name "${trimmed}" is already taken - pick another.`, true);
					suggestion = trimmed;
					continue;
				}
				hydra.setStatus(`could not claim room name (${result.reason ?? 'unknown'}).`, true);
				return;
			}
		}
	},

	setStatus(msg: string, error = false): void {
		this.status = msg;
		this.isError = error;
	},

	runCode(snippet: string): void {
		if (!instance) {
			return;
		}
		const globals = { ...instance.synth, pb } as Record<string, unknown>;
		const names = Object.keys(globals);
		const values = Object.values(globals);
		try {
			const fn = new Function(...names, snippet);
			fn(...values);
			this.setStatus('');
		} catch (error) {
			this.setStatus(`error: ${(error as Error).message}`, true);
			console.error('eval error', error);
		}
	},

	runAll(): void {
		this.runCode(this.code);
	},

	runLine(): void {
		const textarea = get(editorRef);
		if (!textarea) {
			return;
		}
		if (textarea.selectionStart !== textarea.selectionEnd) {
			this.runCode(textarea.value.slice(textarea.selectionStart, textarea.selectionEnd));
			return;
		}
		const lines = textarea.value.split('\n');
		let pos = 0;
		for (const line of lines) {
			const end = pos + line.length;
			if (textarea.selectionStart <= end) {
				this.runCode(line);
				return;
			}
			pos = end + 1;
		}
	},

	clearAll(): void {
		if (!instance) {
			return;
		}
		instance.hush();
		this.setStatus('cleared.');
	},

	loadSketchAt(idx: number): void {
		const next = getSketch(idx);
		this.clearAll();
		this.sketchIndex = next.index;
		this.code = next.code;
		this.runAll();
		this.setStatus(`loaded ${next.name} (${next.index + 1}/${sketches.length})`);
	},

	shuffle(): void {
		this.loadSketchAt(getRandomSketch(this.sketchIndex).index);
	},

	nextSketch(): void {
		this.loadSketchAt(this.sketchIndex < 0 ? 0 : this.sketchIndex + 1);
	},

	prevSketch(): void {
		this.loadSketchAt(this.sketchIndex < 0 ? sketches.length - 1 : this.sketchIndex - 1);
	},

	onPickSketch(e: Event): void {
		const v = (e.target as HTMLSelectElement).value;
		if (v === '') {
			return;
		}
		this.loadSketchAt(Number.parseInt(v, 10));
	},

	toggleEditor(): void {
		this.editorVisible = !this.editorVisible;
	},

	toggleInfo(): void {
		this.infoVisible = !this.infoVisible;
	},

	onKeydown(e: KeyboardEvent): void {
		if (!e.ctrlKey && !e.metaKey) {
			return;
		}

		if (e.shiftKey && e.key === 'Enter') {
			e.preventDefault();
			this.runAll();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			this.runLine();
		} else if (e.key === '~') {
			e.preventDefault();
			this.toggleEditor();
		}
	},

	resizeCanvas(): void {
		if (!instance || !get(canvasRef)) {
			return;
		}
		const c = get(canvasRef)!;
		const dpr = window.devicePixelRatio || 1;
		const w = Math.max(1, Math.round(c.clientWidth * dpr));
		const h = Math.max(1, Math.round(c.clientHeight * dpr));
		if (c.width !== w || c.height !== h) {
			instance.setResolution(w, h);
		}
	},

	teardown(): void {
		if (pb) {
			pb.destroy();
			pb = null;
		}
		this.network.pbRoomName = '';
		this.network.peers = [];
		this.network.peerCount = 0;
		if (instance) {
			instance.hush();
			instance = null;
		}
	}
});

onBeforeUnmount(() => hydra.teardown());

useResizeObserver(canvasRef, () => hydra.resizeCanvas());

watch(
	() => hydra.isOpen,
	async (opened) => {
		if (!opened) {
			hydra.teardown();
			return;
		}
		await nextTick();
		if (!get(canvasRef) || instance) {
			return;
		}
		try {
			pb = hydra.network.createPatchBay();
			instance = new Hydra({
				autoLoop: true,
				canvas: get(canvasRef)!,
				detectAudio: true,
				enableStreamCapture: true,
				makeGlobal: false,
				pb
			});
			pb.init(instance.captureStream, { room: 'computer' });
			hydra.resizeCanvas();
			hydra.runAll();
			hydra.setStatus('ctrl+enter to run a line / ctrl+shift+enter to run all / click ⇄ to create a room');
		} catch (error) {
			hydra.setStatus(`init error: ${(error as Error).message}`, true);
			console.error(error);
		}
	}
);
</script>

<template>
	<AppWindow
		app-i-d="hydra"
		@open="hydra.isOpen = true"
		@close="
			hydra.isOpen = false;
			hydra.teardown();
		">
		<div class="hydra" @keydown="hydra.onKeydown">
			<canvas ref="canvas" />

			<div class="toolbar">
				<button type="button" title="run all (ctrl+shift+enter)" @click="hydra.runAll">▶ run</button>
				<button type="button" title="clear all" @click="hydra.clearAll">⌫ clear</button>
				<div class="presets" title="example sketches">
					<button type="button" title="previous example" @click="hydra.prevSketch">◀</button>
					<select
						:value="hydra.sketchIndex < 0 ? '' : String(hydra.sketchIndex)"
						class="preset-select"
						title="pick example"
						@change="hydra.onPickSketch">
						<option v-for="(name, i) in sketches.map((e) => e.name)" :key="name" :value="i">
							{{ `${i + 1}. ${name}` }}
						</option>
					</select>
					<button type="button" title="next example" @click="hydra.nextSketch">▶</button>
					<button type="button" title="show random sketch" @click="hydra.shuffle">⤭</button>
				</div>
				<button type="button" title="toggle editor (ctrl+shift+h)" @click="hydra.toggleEditor">
					{{ hydra.editorVisible ? '◐ hide' : '◑ show' }}
				</button>
				<button
					type="button"
					:title="`patch bay peers: ${hydra.network.peerListLabel}`"
					@click="hydra.network.setName">
					⇄ {{ hydra.network.pbRoomName || 'patch bay'
					}}<span v-if="hydra.network.peerCount"> ({{ hydra.network.peerCount }})</span>
				</button>
				<button type="button" title="info" @click="hydra.toggleInfo">?</button>
			</div>

			<textarea
				v-model="hydra.code"
				v-show="hydra.editorVisible"
				ref="editor"
				class="editor"
				spellcheck="false"
				autocorrect="off"
				autocomplete="off"
				autocapitalize="off">
			</textarea>

			<div v-show="hydra.editorVisible" class="status" :class="{ error: hydra.isError }">
				&gt;&gt; <span>{{ hydra.status }}</span>
			</div>

			<div v-show="hydra.infoVisible" class="info">
				<div class="info-inner">
					<h3 class="info-h">Hydra</h3>
					<p>live coding video synth</p>

					<p><strong>keys</strong></p>
					<ul class="info-list">
						<li><code>ctrl + enter</code> - run current line / selection</li>
						<li><code>ctrl + shift + enter</code> - run everything</li>
						<li><code>ctrl + shift + ~</code> - show / hide editor</li>
					</ul>

					<p><strong>networking (patch bay)</strong></p>
					<ol class="info-list">
						<li>click <code>⇄ patch bay</code> and pick a room name</li>
						<li>your sketch can then be accessed by others with:</li>
						<code>s0.initStream('{{ hydra.network.suggestedPeer }}'); src(s0).out();</code>
					</ol>
					<p>
						currently connected: <code>{{ hydra.network.peerListLabel }}</code>
					</p>

					<p>
						more:
						<a href="https://hydra.ojack.xyz/docs" target="_blank">docs</a>
						·
						<a href="https://hydra.ojack.xyz/functions" target="_blank">function reference</a>
					</p>

					<button type="button" class="info-close" @click="hydra.toggleInfo">close</button>
				</div>
			</div>
		</div>
	</AppWindow>
</template>

<style scoped>
.hydra {
	background: #000;
	color: #f9ff8d;
	height: 100%;
	overflow: hidden;
	position: relative;
	width: 100%;

	& canvas {
		display: block;
		height: 100%;
		inset: 0;
		position: absolute;
		width: 100%;
	}

	& .toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		justify-content: flex-end;
		position: absolute;
		right: 8px;
		top: 8px;
		z-index: 3;
	}

	& .toolbar button,
	& .preset-select {
		background: rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(249, 255, 141, 0.33);
		color: #f9ff8d;
		font-size: 11px;
		padding: 4px 8px;
		text-overflow: ellipsis;
	}

	& .toolbar button:hover {
		background: rgba(249, 255, 141, 0.15);
		border-color: #f9ff8d;
	}

	& .presets {
		display: flex;
		gap: 0;
	}

	& .presets button,
	& .presets .preset-select {
		border-radius: 0;
		margin-right: -1px;
	}

	& .preset-select {
		appearance: none;
		max-width: 140px;
		-webkit-appearance: none;
	}

	& .preset-select option {
		background: #111;
		color: #f9ff8d;
	}

	& .editor {
		background: transparent;
		border: none;
		box-sizing: border-box;
		caret-color: #fff;
		color: #f9ff8d;
		font-size: 14px;
		inset: 80px 8px 28px 8px;
		line-height: 1.4;
		outline: none;
		padding: 8px;
		position: absolute;
		resize: none;
		text-shadow: 0 0 4px rgba(249, 255, 141, 0.4);
		width: calc(100% - 16px);
		z-index: 1;
	}

	& .editor::selection {
		background: rgba(249, 255, 141, 0.35);
	}

	& .status {
		-webkit-user-select: text;
		background: rgba(0, 0, 0, 0.4);
		bottom: 4px;
		color: #f9ff8d;
		cursor: text;
		font-size: 12px;
		left: 8px;
		padding: 2px 6px;
		position: absolute;
		right: 8px;
		user-select: text;
		z-index: 2;
	}

	& .status.error {
		color: #ff7a7a;
	}

	& .info {
		align-items: flex-start;
		background: rgba(0, 0, 0, 0.85);
		box-sizing: border-box;
		display: flex;
		inset: 0;
		justify-content: center;
		overflow-y: auto;
		padding: 24px;
		position: absolute;
		z-index: 10;
	}

	& .info-inner {
		color: #f9ff8d;
		font-size: 13px;
		line-height: 1.45;
		max-width: 640px;
		user-select: text;
		width: 100%;
	}

	& .info-h {
		color: #f9ff8d;
		font-size: 20px;
		font-weight: bold;
		margin: 0 0 12px;
	}

	& .info-list {
		color: #f9ff8d;
		margin: 6px 0 10px 20px;
		padding: 0;
	}

	& .info-list li {
		list-style-position: outside;
		margin: 4px 0;
	}

	& .info-inner {
		& a {
			color: #f9ff8d;
			text-decoration: underline;
		}

		& code {
			background: rgba(249, 255, 141, 0.15);
			padding: 1px 4px;
		}

		& p {
			color: #f9ff8d;
			margin: 8px 0;
		}
	}

	& .info-close {
		background: transparent;
		border: 1px solid #f9ff8d;
		color: #f9ff8d;
		cursor: pointer;
		font-size: 12px;
		margin-top: 16px;
		padding: 6px 14px;
	}

	& .info-close:hover {
		background: rgba(249, 255, 141, 0.15);
	}
}
</style>
