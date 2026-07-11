import { Actor } from '@cloudflare/actors';
import type { ActorConfiguration } from '@cloudflare/actors';

interface DiabloAttach {
	id: string;
	peerID: number;
	version: number;
	session: string | null;
}

interface DiabloPeer {
	ws: WebSocket;
	attach: DiabloAttach;
}

interface DiabloSession {
	name: string;
	password: string;
	difficulty: number;
	seed: number;
	hostVersion: number;
}

const BATCH_OPCODE = 0x00;
const BROADCAST_ID = 0xff;
const INFO_OPCODE = 0x31;
const MAX_PLAYERS = 4;
const REJECT_BAD_PASSWORD = 0x03;
const REJECT_FULL = 0x05;
const REJECT_NOT_FOUND = 0x02;
const RELAY_VERSION = 1;
const VERSION_OPCODE = 0x32;

// Wrap a single sub-packet in a batch frame: [0x00, 1:u16, sub-packet].
function batchOne(packet: Uint8Array): Uint8Array {
	const out = new Uint8Array(3 + packet.byteLength);
	out[0] = BATCH_OPCODE;
	new DataView(out.buffer).setUint16(1, 1, true);
	out.set(packet, 3);
	return out;
}

function clampU8(value: number): number {
	return ((value % 256) + 256) % 256;
}

// Compute the byte length of a client-to-server sub-packet's payload.
// offset points at the byte immediately after the opcode.
// Returns -1 if the buffer is too small or the opcode is unknown.
function clientPayloadSize(opcode: number, buf: Uint8Array, offset: number): number {
	const remaining = buf.byteLength - offset;
	if (opcode === 0x22 || opcode === 0x23) {
		// 0x22 create_game: u32 cookie, u8 nLen, name, u8 pLen, pwd, u32 difficulty
		// 0x23 join_game:   u32 cookie, u8 nLen, name, u8 pLen, pwd
		if (remaining < 5) {
			return -1;
		}
		const nLen = buf[offset + 4] ?? 0;
		if (remaining < 5 + nLen + 1) {
			return -1;
		}
		const pLen = buf[offset + 4 + 1 + nLen] ?? 0;
		const trailer = opcode === 0x22 ? 4 : 0;
		const total = 4 + 1 + nLen + 1 + pLen + trailer;
		return remaining >= total ? total : -1;
	}
	if (opcode === 0x24) {
		return 0;
	}
	if (opcode === 0x03) {
		return remaining >= 5 ? 5 : -1;
	}
	if (opcode === 0x01) {
		// u8 destId, u32 size, payload[size]
		if (remaining < 5) {
			return -1;
		}
		const dv = new DataView(buf.buffer, buf.byteOffset + offset + 1, 4);
		const size = dv.getUint32(0, true);
		const total = 5 + size;
		return remaining >= total ? total : -1;
	}
	if (opcode === 0x02) {
		return remaining >= 4 ? 4 : -1;
	}
	return -1;
}

function decodeName(payload: Uint8Array, offset: number): { value: string; next: number } | null {
	if (offset >= payload.byteLength) {
		return null;
	}
	const len = payload[offset] ?? 0;
	const start = offset + 1;
	const end = start + len;
	if (end > payload.byteLength) {
		return null;
	}
	return { value: new TextDecoder().decode(payload.subarray(start, end)), next: end };
}

function sendBatched(ws: WebSocket, packet: Uint8Array): void {
	ws.send(batchOne(packet));
}

// Build a sub-packet: [code:u8, payload] (no length prefix).
function writePacket(opcode: number, payload: Uint8Array): Uint8Array {
	const out = new Uint8Array(1 + payload.byteLength);
	out[0] = clampU8(opcode);
	out.set(payload, 1);
	return out;
}

export class Diablo extends Actor<Env> {
	private readonly sessions = new Map<string, DiabloSession>();

	public static override configuration(): ActorConfiguration {
		return { sockets: { upgradePath: '/diablo-relay' } };
	}

	private static attach(ws: WebSocket): DiabloAttach {
		return (
			(ws.deserializeAttachment() as DiabloAttach | null) ?? {
				id: '',
				peerID: -1,
				version: 0,
				session: null
			}
		);
	}

	private static handleHandshake(ws: WebSocket, attach: DiabloAttach, u8: Uint8Array): void {
		if (u8[0] !== INFO_OPCODE || u8.byteLength < 5) {
			console.log(`[diablo] bad handshake id=${attach.id} byte0=0x${u8[0]?.toString(16)} len=${u8.byteLength}`);
			ws.close(1002, 'expected client info');
			return;
		}
		// Stored only as a non-zero marker that handshake is complete.
		attach.version = 1;
		ws.serializeAttachment(attach);
		console.log(`[diablo] handshake ok id=${attach.id} v=${u8[1]}.${u8[2]}.${u8[3]}`);
	}

	private static sendJoinAccept(
		ws: WebSocket,
		cookie: number,
		index: number,
		seed: number,
		difficulty: number
	): void {
		const payload = new Uint8Array(13);
		const dv = new DataView(payload.buffer);
		dv.setUint32(0, cookie, true);
		payload[4] = clampU8(index);
		dv.setUint32(5, seed, true);
		dv.setUint32(9, difficulty, true);
		sendBatched(ws, writePacket(0x12, payload));
	}

	private static sendJoinReject(ws: WebSocket, cookie: number, reason: number): void {
		const payload = new Uint8Array(5);
		new DataView(payload.buffer).setUint32(0, cookie, true);
		payload[4] = clampU8(reason);
		sendBatched(ws, writePacket(0x15, payload));
	}

	public override async webSocketError(ws: WebSocket): Promise<void> {
		await this.webSocketClose(ws, 1006);
	}

	protected override onWebSocketConnect(ws: WebSocket): void {
		const id = crypto.randomUUID();
		const attach: DiabloAttach = { id, peerID: -1, version: 0, session: null };
		ws.serializeAttachment(attach);
		const handshake = new Uint8Array(5);
		handshake[0] = VERSION_OPCODE;
		new DataView(handshake.buffer).setUint32(1, RELAY_VERSION, true);
		ws.send(handshake);
		console.log(`[diablo] new connection id=${id}`);
	}

	protected override onWebSocketDisconnect(ws: WebSocket): void {
		const attach = Diablo.attach(ws);
		if (attach.peerID >= 0 && attach.session) {
			this.dropPeer(ws, attach, 0x40_00_00_06);
		}
	}

	protected override onWebSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): void {
		if (typeof raw === 'string') {
			return;
		}
		const u8 = new Uint8Array(raw);
		if (u8.byteLength < 1) {
			return;
		}
		const attach = Diablo.attach(ws);

		if (attach.version === 0) {
			Diablo.handleHandshake(ws, attach, u8);
			return;
		}

		if (u8[0] !== BATCH_OPCODE || u8.byteLength < 3) {
			return;
		}
		const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
		const count = view.getUint16(1, true);
		let offset = 3;
		for (let i = 0; i < count; i++) {
			if (offset + 1 > u8.byteLength) {
				return;
			}
			const opcode = u8[offset] ?? 0;
			offset += 1;
			const payloadLen = clientPayloadSize(opcode, u8, offset);
			if (payloadLen < 0) {
				console.log(`[diablo] bad sub-packet id=${attach.id} opcode=0x${opcode.toString(16)} offset=${offset}`);
				return;
			}
			const payload = u8.subarray(offset, offset + payloadLen);
			offset += payloadLen;
			this.dispatch(ws, attach, opcode, payload);
		}
	}

	protected override shouldUpgradeSocket(): boolean {
		return true;
	}

	private dispatch(ws: WebSocket, attach: DiabloAttach, opcode: number, payload: Uint8Array): void {
		console.log(
			`[diablo] dispatch id=${attach.id} opcode=0x${opcode.toString(16)} payloadLen=${payload.byteLength}`
		);
		if (opcode === 0x22) {
			this.onCreateGame(ws, attach, payload);
		} else if (opcode === 0x23) {
			this.onJoinGame(ws, attach, payload);
		} else if (opcode === 0x24) {
			this.dropPeer(ws, attach, 0);
		} else if (opcode === 0x03) {
			this.onDropPlayer(attach, payload);
		} else if (opcode === 0x01) {
			this.onMessage(attach, payload);
		} else if (opcode === 0x02) {
			this.onTurn(ws, attach, payload);
		}
	}

	private dropPeer(ws: WebSocket, attach: DiabloAttach, reason: number): void {
		const { session, peerID } = attach;
		if (session === null || peerID < 0) {
			try {
				ws.close(1000, 'leave');
			} catch {
				/* ignore */
			}
			return;
		}
		const wasHost = peerID === 0;
		const payload = new Uint8Array(5);
		payload[0] = clampU8(peerID);
		new DataView(payload.buffer).setUint32(1, reason, true);
		const packet = writePacket(0x14, payload);
		for (const { ws: peer } of this.peersOf(session, ws)) {
			sendBatched(peer, packet);
		}
		attach.peerID = -1;
		attach.session = null;
		ws.serializeAttachment(attach);
		try {
			ws.close(1000, 'leave');
		} catch {
			/* ignore */
		}
		if (wasHost) {
			this.sessions.delete(session);
			for (const { ws: peer, attach: a } of this.peersOf(session)) {
				this.dropPeer(peer, a, reason);
			}
		}
	}

	private fanout(sender: DiabloAttach, destID: number, packet: Uint8Array): void {
		if (sender.session === null) {
			return;
		}
		for (const { ws: peer, attach: a } of this.peersOf(sender.session)) {
			if (a.peerID === sender.peerID) {
				continue;
			}
			if (destID !== BROADCAST_ID && a.peerID !== destID) {
				continue;
			}
			sendBatched(peer, packet);
		}
	}

	private nextSlot(key: string): number {
		const taken = new Set<number>();
		for (const { attach: a } of this.peersOf(key)) {
			taken.add(a.peerID);
		}
		for (let i = 1; i < MAX_PLAYERS; i++) {
			if (!taken.has(i)) {
				return i;
			}
		}
		return -1;
	}

	private onCreateGame(ws: WebSocket, attach: DiabloAttach, payload: Uint8Array): void {
		if (payload.byteLength < 4) {
			console.log(`[diablo] create_game too short id=${attach.id}`);
			return;
		}
		const dv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
		const cookie = dv.getUint32(0, true);
		const name = decodeName(payload, 4);
		if (!name) {
			return;
		}
		const pwd = decodeName(payload, name.next);
		if (!pwd || pwd.next + 4 > payload.byteLength) {
			return;
		}
		const difficulty = dv.getUint32(pwd.next, true);
		const key = name.value.toLowerCase();
		if (this.sessions.has(key)) {
			Diablo.sendJoinReject(ws, cookie, REJECT_NOT_FOUND);
			return;
		}
		const seed = Math.floor(Math.random() * 4_294_967_296);
		this.sessions.set(key, {
			name: name.value,
			password: pwd.value,
			difficulty,
			seed,
			hostVersion: attach.version
		});
		attach.peerID = 0;
		attach.session = key;
		ws.serializeAttachment(attach);
		Diablo.sendJoinAccept(ws, cookie, 0, seed, difficulty);
		sendBatched(ws, writePacket(0x13, new Uint8Array([0])));
		console.log(`[diablo] create_game id=${attach.id} name="${name.value}" seed=${seed}`);
	}

	private onDropPlayer(attach: DiabloAttach, payload: Uint8Array): void {
		if (payload.byteLength < 5 || attach.session === null) {
			return;
		}
		const targetID = payload[0] ?? 0;
		const reason = new DataView(payload.buffer, payload.byteOffset, payload.byteLength).getUint32(1, true);
		for (const { ws: peer, attach: a } of this.peersOf(attach.session)) {
			if (a.peerID === targetID) {
				this.dropPeer(peer, a, reason);
				return;
			}
		}
	}

	private onJoinGame(ws: WebSocket, attach: DiabloAttach, payload: Uint8Array): void {
		if (payload.byteLength < 4) {
			return;
		}
		const dv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
		const cookie = dv.getUint32(0, true);
		const name = decodeName(payload, 4);
		if (!name) {
			return;
		}
		const pwd = decodeName(payload, name.next);
		if (!pwd) {
			return;
		}
		const key = name.value.toLowerCase();
		const session = this.sessions.get(key);
		if (!session) {
			Diablo.sendJoinReject(ws, cookie, REJECT_NOT_FOUND);
			return;
		}
		if (session.password !== pwd.value) {
			Diablo.sendJoinReject(ws, cookie, REJECT_BAD_PASSWORD);
			return;
		}
		const slot = this.nextSlot(key);
		if (slot < 0) {
			Diablo.sendJoinReject(ws, cookie, REJECT_FULL);
			return;
		}
		attach.peerID = slot;
		attach.session = key;
		ws.serializeAttachment(attach);
		Diablo.sendJoinAccept(ws, cookie, slot, session.seed, session.difficulty);
		const connect = writePacket(0x13, new Uint8Array([slot]));
		for (const { ws: peer } of this.peersOf(key, ws)) {
			sendBatched(peer, connect);
		}
	}

	private onMessage(attach: DiabloAttach, payload: Uint8Array): void {
		if (payload.byteLength < 5 || attach.session === null || attach.peerID < 0) {
			return;
		}
		const destID = payload[0] ?? 0;
		const dv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
		const size = dv.getUint32(1, true);
		if (5 + size > payload.byteLength) {
			return;
		}
		const body = payload.subarray(5, 5 + size);
		const out = new Uint8Array(5 + body.byteLength);
		out[0] = clampU8(attach.peerID);
		new DataView(out.buffer).setUint32(1, size, true);
		out.set(body, 5);
		const packet = writePacket(0x01, out);
		this.fanout(attach, destID, packet);
	}

	private onTurn(ws: WebSocket, attach: DiabloAttach, payload: Uint8Array): void {
		if (payload.byteLength < 4 || attach.session === null || attach.peerID < 0) {
			return;
		}
		const turn = new DataView(payload.buffer, payload.byteOffset, payload.byteLength).getUint32(0, true);
		const out = new Uint8Array(5);
		out[0] = clampU8(attach.peerID);
		new DataView(out.buffer).setUint32(1, turn, true);
		const packet = writePacket(0x02, out);
		for (const { ws: peer } of this.peersOf(attach.session, ws)) {
			sendBatched(peer, packet);
		}
	}

	private peersOf(session: string, exclude?: WebSocket): DiabloPeer[] {
		const out: DiabloPeer[] = [];
		for (const ws of this.ctx.getWebSockets()) {
			if (ws === exclude) {
				continue;
			}
			const attach = Diablo.attach(ws);
			if (attach.session === session && attach.peerID >= 0) {
				out.push({ ws, attach });
			}
		}
		return out;
	}
}
