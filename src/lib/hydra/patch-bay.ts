// @ts-ignore
import SimplePeer from 'simple-peer/simplepeer.min.js';

type Listener = (...args: unknown[]) => void;

interface Peer {
	rtc: any;
	initiator: boolean;
	stream?: MediaStream;
}

export interface PatchBayInitOptions {
	server?: string;
	room?: string;
}

export interface SetNameResult {
	ok: boolean;
	roomName: string;
	reason?: 'taken' | 'empty' | 'disconnected';
}

export class PatchBay {
	id = '';
	roomName: string | null = null;
	stream: MediaStream | null = null;
	roomNameFromID: Record<string, string> = {};
	idFromRoomName: Record<string, string> = {};
	peerIds = new Set<string>();

	private listeners: Record<string, Listener[]> = {};
	private ws: WebSocket | null = null;
	private rtcPeers: Record<string, Peer> = {};
	private iceServers: RTCIceServer[] = [];
	private pendingNameRequests: Record<string, (r: SetNameResult) => void> = {};
	private nextRequestID = 1;
	private settings = {
		shareMediaWhenRequested: true,
		shareMediaWhenInitiating: false,
		requestMediaWhenInitiating: true
	};

	init(stream: MediaStream | null, opts: PatchBayInitOptions = {}): void {
		this.stream = stream;
		const url = opts.server ?? defaultSignalUrl();
		const room = opts.room ?? 'iclc';
		const u = new URL(url, location.href);
		u.searchParams.set('room', room);
		this.ws = new WebSocket(u.toString());
		this.ws.addEventListener('open', () => {
			this.ws?.send(JSON.stringify({ type: 'join' }));
		});
		this.ws.addEventListener('message', (ev) => this._handleSignalMessage(String(ev.data)));
		this.ws.addEventListener('close', () => {
			this.emit('close');
			// reject any in-flight name claims so callers don't hang forever.
			for (const cb of Object.values(this.pendingNameRequests)) {
				cb({ ok: false, roomName: '', reason: 'disconnected' });
			}
			this.pendingNameRequests = {};
		});
	}

	on(event: string, fn: Listener): void {
		(this.listeners[event] ??= []).push(fn);
	}

	off(event: string, fn: Listener): void {
		const arr = this.listeners[event];
		if (!arr) return;
		this.listeners[event] = arr.filter((l) => l !== fn);
	}

	private emit(event: string, ...args: unknown[]): void {
		(this.listeners[event] ?? []).slice().forEach((l) => {
			try {
				l(...args);
			} catch (e) {
				console.warn('pb listener error', e);
			}
		});
	}

	setName(roomName: string): Promise<SetNameResult> {
		return new Promise((resolve) => {
			if (this.ws?.readyState !== WebSocket.OPEN) {
				const send = (): void => {
					this.ws?.removeEventListener('open', send);
					this.setName(roomName).then(resolve);
				};
				this.ws?.addEventListener('open', send);
				return;
			}
			const requestID = String(this.nextRequestID++);
			this.pendingNameRequests[requestID] = (r) => {
				if (r.ok) {
					const previous = this.roomName;
					this.roomName = r.roomName;
					if (previous && this.idFromRoomName[previous] === this.id) {
						delete this.idFromRoomName[previous];
					}
					this.roomNameFromID[this.id] = r.roomName;
					this.idFromRoomName[r.roomName] = this.id;
					document.title = r.roomName;
				}
				resolve(r);
			};
			this.ws.send(JSON.stringify({ type: 'set-name', roomName, requestID }));
		});
	}

	list(): string[] {
		return Object.keys(this.idFromRoomName);
	}

	initSource(roomName: string): void {
		const targetId = this.idFromRoomName[roomName];
		if (!targetId) {
			console.warn(`[hydra pb] no peer named "${roomName}". Known:`, this.list());
			this.emit('init source failed', roomName, this.list());
			return;
		}
		const existing = this.rtcPeers[targetId];
		if (existing?.stream) {
			const liveTracks = existing.stream.getTracks().filter((t) => t.readyState === 'live');
			if (liveTracks.length === 0) {
				console.warn('[hydra pb] stream tracks ended for', roomName, '— reconnecting');
				try {
					existing.rtc.destroy();
				} catch {
					/*_*/
				}
				delete this.rtcPeers[targetId];
				setTimeout(() => this._initRtcPeer(targetId, true), 100);
				this.emit('init source', roomName);
				return;
			}
			const proxyStream = new MediaStream(liveTracks.map((t) => t.clone()));
			const video = document.createElement('video');
			video.muted = true;
			video.autoplay = true;
			video.playsInline = true;
			(video as any).srcObject = proxyStream;
			setTimeout(() => {
				const fire = (): void => {
					void video.play();
					this.emit('got video', roomName, video);
				};
				if (video.readyState >= HTMLMediaElement.HAVE_METADATA) fire();
				else video.addEventListener('loadedmetadata', fire, { once: true });
			}, 0);
			this.emit('init source', roomName);
			return;
		}
		this._initRtcPeer(targetId, true);
		this.emit('init source', roomName);
	}

	destroy(): void {
		Object.values(this.rtcPeers).forEach((p) => {
			try {
				p.rtc.destroy();
			} catch {
				/*_*/
			}
		});
		this.rtcPeers = {};
		try {
			this.ws?.close();
		} catch {
			/*_*/
		}
		this.ws = null;
		this.listeners = {};
		this.pendingNameRequests = {};
	}

	private _handleSignalMessage(raw: string): void {
		let msg: any;
		try {
			msg = JSON.parse(raw);
		} catch {
			return;
		}
		switch (msg.type) {
			case 'ready': {
				this.id = msg.id;
				this.iceServers = msg.servers ?? [];
				for (const peer of msg.peers as { id: string; roomName: string | null }[]) {
					this.peerIds.add(peer.id);
					if (peer.roomName) {
						this.roomNameFromID[peer.id] = peer.roomName;
						this.idFromRoomName[peer.roomName] = peer.id;
					}
				}
				this.emit('ready');
				break;
			}
			case 'new peer': {
				this.peerIds.add(msg.id as string);
				this.emit('new peer', msg.id);
				break;
			}
			case 'peer-name': {
				const { id, roomName } = msg as { id: string; roomName: string };
				const previous = this.roomNameFromID[id];
				if (previous && this.idFromRoomName[previous] === id) {
					delete this.idFromRoomName[previous];
				}
				this.roomNameFromID[id] = roomName;
				this.idFromRoomName[roomName] = id;
				this.emit('peer-name', id, roomName);
				break;
			}
			case 'peer left': {
				const peerId = msg.id as string;
				this.peerIds.delete(peerId);
				const roomName = this.roomNameFromID[peerId];
				if (roomName) delete this.idFromRoomName[roomName];
				delete this.roomNameFromID[peerId];
				if (this.rtcPeers[peerId]) {
					try {
						this.rtcPeers[peerId].rtc.destroy();
					} catch {
						/* noop */
					}
					delete this.rtcPeers[peerId];
				}
				this.emit('peer left', peerId);
				break;
			}
			case 'name-result': {
				const cb = this.pendingNameRequests[msg.requestID];
				if (cb) {
					delete this.pendingNameRequests[msg.requestID];
					cb({ ok: !!msg.ok, roomName: msg.roomName, reason: msg.reason });
				}
				break;
			}
			case 'message':
				if (!this.rtcPeers[msg.id]) this._initRtcPeer(msg.id, false);
				this.rtcPeers[msg.id]?.rtc.signal(msg.message);
				break;
		}
	}

	private _initRtcPeer(peerId: string, initiator: boolean): void {
		if (this.rtcPeers[peerId]) return;
		const opts: any = { initiator, trickle: true, config: { iceServers: this.iceServers } };
		if (initiator) {
			if (this.settings.shareMediaWhenInitiating && this.stream) opts.stream = this.stream;
			if (this.settings.requestMediaWhenInitiating) {
				opts.offerOptions = { offerToReceiveVideo: true, offerToReceiveAudio: true };
			}
		} else if (this.settings.shareMediaWhenRequested && this.stream) {
			opts.stream = this.stream;
		}
		const rtc = new SimplePeer(opts);
		this.rtcPeers[peerId] = { rtc, initiator };

		rtc.on('signal', (signal: unknown) => {
			this.ws?.send(JSON.stringify({ type: 'message', id: peerId, message: signal, signalType: 'signal' }));
		});
		rtc.on('stream', (stream: MediaStream) => {
			const peer = this.rtcPeers[peerId];
			if (!peer) {
				return;
			}
			peer.stream = stream;
			const roomName = this.roomNameFromID[peerId] ?? peerId;
			const proxyStream = new MediaStream(stream.getTracks().map((t) => t.clone()));
			const video = document.createElement('video');
			video.muted = true;
			video.autoplay = true;
			video.playsInline = true;
			(video as any).srcObject = proxyStream;
			video.addEventListener('loadedmetadata', () => {
				void video.play();
				this.emit('got video', roomName, video);
			});
			this.emit('stream', peerId, stream);
		});
		rtc.on('close', () => {
			delete this.rtcPeers[peerId];
		});
		rtc.on('error', (e: unknown) => {
			console.warn('[hydra pb] peer error', peerId, e);
		});
	}
}

function defaultSignalUrl(): string {
	const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
	return `${proto}//${location.host}/hydra-server`;
}
