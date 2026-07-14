import { Actor } from '@cloudflare/actors';
import type { ActorConfiguration } from '@cloudflare/actors';

export class Tally extends Actor<Env> {
	public static override configuration(): ActorConfiguration {
		return { sockets: { upgradePath: '/tally' } };
	}

	public async total(): Promise<number> {
		return this.load();
	}

	protected override async onRequest(): Promise<Response> {
		return Response.json({ value: await this.load() }, { headers: { 'Cache-Control': 'no-store' } });
	}

	protected override async onWebSocketConnect(ws: WebSocket): Promise<void> {
		ws.send(JSON.stringify({ type: 'count', value: await this.load() }));
	}

	protected override async onWebSocketMessage(_ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
		if (typeof message !== 'string' || message.length > 256) {
			return;
		}
		let parsed: { type?: unknown } | null = null;
		try {
			parsed = JSON.parse(message) as { type?: unknown };
		} catch {
			return;
		}
		if (parsed?.type !== 'increment') {
			return;
		}
		const next = (await this.load()) + 1;
		await this.ctx.storage.put('total', next);
		this.sockets.message(JSON.stringify({ type: 'count', value: next }), '*');
	}

	protected override shouldUpgradeSocket(): boolean {
		return true;
	}

	private async load(): Promise<number> {
		return (await this.ctx.storage.get<number>('total')) ?? 0;
	}
}
