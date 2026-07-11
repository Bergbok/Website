import { Actor } from '@cloudflare/actors';
import type { ActorConfiguration } from '@cloudflare/actors';

interface PeerMeta {
	id: string;
	roomName: string | null;
}

interface PeerAttachment {
	connectionID?: string;
	queryParams?: Record<string, string>;
	roomName?: string | null;
}

export class HydraServer extends Actor<Env> {
	private iceServersCache: { value: RTCIceServer[]; expiresAt: number } | null = null;

	public static override configuration(): ActorConfiguration {
		return { sockets: { upgradePath: '/hydra-server' } };
	}

	private static meta(ws: WebSocket): PeerMeta {
		const a = (ws.deserializeAttachment() as PeerAttachment | null) ?? {};
		return { id: a.connectionID ?? '', roomName: a.roomName ?? null };
	}

	public override async webSocketError(ws: WebSocket): Promise<void> {
		await this.webSocketClose(ws, 1006);
	}

	protected override async onWebSocketDisconnect(ws: WebSocket): Promise<void> {
		const { id: leftID } = HydraServer.meta(ws);
		if (!leftID) {
			return;
		}
		this.sockets.message(JSON.stringify({ type: 'peer left', id: leftID }), '*');
	}

	protected override async onWebSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
		if (typeof raw !== 'string') {
			return;
		}
		let msg: { type: string; [k: string]: unknown } = { type: '' };
		try {
			msg = JSON.parse(raw);
		} catch {
			return;
		}
		const self = HydraServer.meta(ws);

		if (msg.type === 'join') {
			const servers = await this.getIceServers();
			const peers = this.peers().filter((p) => p.id !== self.id);
			ws.send(
				JSON.stringify({
					type: 'ready',
					id: self.id,
					peers: peers.map((p) => ({ id: p.id, roomName: p.roomName })),
					servers
				})
			);
			this.sockets.message(JSON.stringify({ type: 'new peer', id: self.id }), '*', [ws]);
			return;
		}

		if (msg.type === 'set-name') {
			const roomName = typeof msg.roomName === 'string' ? msg.roomName.trim() : '';
			const { requestID } = msg;
			if (!roomName) {
				ws.send(JSON.stringify({ type: 'name-result', ok: false, roomName, requestID, reason: 'empty' }));
				return;
			}
			const taken = this.peers().some((p) => p.id !== self.id && p.roomName === roomName);
			if (taken) {
				ws.send(JSON.stringify({ type: 'name-result', ok: false, roomName, requestID, reason: 'taken' }));
				return;
			}
			const attachment = (ws.deserializeAttachment() as PeerAttachment | null) ?? {};
			ws.serializeAttachment({ ...attachment, roomName });
			ws.send(JSON.stringify({ type: 'name-result', ok: true, roomName, requestID }));
			this.sockets.message(JSON.stringify({ type: 'peer-name', id: self.id, roomName }), '*', [ws]);
			return;
		}

		if (msg.type === 'message') {
			this.sockets.message(
				JSON.stringify({
					type: 'message',
					id: self.id,
					message: msg.message,
					signalType: msg.signalType ?? 'signal'
				}),
				[msg.id as string]
			);
		}
	}

	protected override shouldUpgradeSocket(): boolean {
		return true;
	}

	private async getIceServers(): Promise<RTCIceServer[]> {
		const fallback: RTCIceServer[] = [
			{ urls: 'stun:stun.cloudflare.com:3478' },
			{ urls: 'stun:stun.l.google.com:19302' }
		];
		const keyID = this.env.TURN_KEY_ID;
		const token = this.env.TURN_KEY_API_TOKEN;
		if (!keyID || !token) {
			return fallback;
		}
		if (this.iceServersCache && Date.now() < this.iceServersCache.expiresAt) {
			return this.iceServersCache.value;
		}
		try {
			const ttl = 86_400;
			const res = await fetch(
				`https://rtc.live.cloudflare.com/v1/turn/keys/${keyID}/credentials/generate-ice-servers`,
				{
					method: 'POST',
					headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
					body: JSON.stringify({ ttl })
				}
			);
			if (!res.ok) {
				console.warn('TURN credential request failed', res.status, await res.text());
				return fallback;
			}
			const body = (await res.json()) as { iceServers: RTCIceServer | RTCIceServer[] };
			const servers = Array.isArray(body.iceServers) ? body.iceServers : [body.iceServers];
			this.iceServersCache = { value: servers, expiresAt: Date.now() + (ttl - 300) * 1000 };
			return servers;
		} catch (error) {
			console.warn('TURN credential request error', error);
			return fallback;
		}
	}

	private peers(): { ws: WebSocket; id: string; roomName: string | null }[] {
		const result: { ws: WebSocket; id: string; roomName: string | null }[] = [];
		for (const ws of this.sockets.connections.values()) {
			const meta = HydraServer.meta(ws);
			result.push({ ws, id: meta.id, roomName: meta.roomName });
		}
		return result;
	}
}
