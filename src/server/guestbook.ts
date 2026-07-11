import RSS from 'rss';
import { englishDataset, englishRecommendedTransformers, RegExpMatcher } from 'obscenity';

const linkPattern = /https?:\/\/[^\s]+/i;
const profanity = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers
});

interface MessageRow {
	MessageID: number;
	Messager: string;
	MessageContent: string;
	MessagePending: boolean;
	MessageDate: string;
}

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
	const form = new FormData();
	form.append('secret', secret);
	form.append('response', token);
	form.append('remoteip', ip);

	const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		body: form
	});
	const result = (await res.json()) as { success: boolean };
	return result.success;
}

export async function handleGuestbook(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const { pathname, searchParams } = url;

	if (pathname === '/guestbook/rss') {
		const { results } = await env.D1.prepare(
			'SELECT * FROM Messages ORDER BY MessageID DESC LIMIT 100'
		).all<MessageRow>();

		const feed = new RSS({
			description: '( ͡° ͜ʖ ͡°)',
			feed_url: 'https://bergbok.computer/guestbook/rss',
			generator: 'computer',
			image_url: 'https://bergbok.computer/favicon/favicon.webp',
			language: 'en-ZA',
			managingEditor: 'bergbok',
			pubDate: results[0]?.MessageDate,
			site_url: 'https://bergbok.computer',
			title: 'bergbok.computer guestbook',
			webMaster: 'bergbok'
		});

		results.map((m) => {
			feed.item({
				guid: String(m.MessageID),
				author: m.Messager,
				categories: [m.MessagePending ? 'pending' : ''],
				date: new Date(m.MessageDate),
				description: m.MessageContent,
				title: `#${m.MessageID} ${m.Messager}: ${m.MessageContent.split('\n').shift()}`,
				url: m.MessagePending
					? 'https://dash.cloudflare.com/?to=/:account/workers/d1/databases/52f5a05b-79ee-4ded-900b-efd1d20316d9/studio'
					: 'https://bergbok.computer/guestbook'
			});
		});

		return new Response(feed.xml({ indent: '\t' }), { headers: { 'Content-Type': 'application/rss+xml' } });
	}

	if (request.method === 'GET') {
		const { results } = await env.D1.prepare(
			`SELECT * FROM Messages WHERE MessagePending = ${searchParams.get('pending') ? '1' : '0'} ORDER BY MessageID DESC`
		).all<MessageRow>();

		const messages = results.map((row) => ({
			id: row.MessageID,
			name: row.Messager,
			date: row.MessageDate,
			pending: row.MessagePending,
			content: row.MessageContent
		}));

		return Response.json({ messages }, { headers: { 'Cache-Control': 'no-store' } });
	}

	async function handlePostGuestbook(req: Request): Promise<Response> {
		const body = (await req.json().catch(() => null)) as {
			name?: unknown;
			content?: unknown;
			token?: unknown;
		} | null;
		if (!body) {
			return Response.json({ error: 'invalid json' }, { status: 400 });
		}

		const name = typeof body.name === 'string' ? body.name.trim() : '';
		const content = typeof body.content === 'string' ? body.content.trim() : '';
		const token = typeof body.token === 'string' ? body.token.trim() : '';

		if (!token) {
			return Response.json({ error: 'turnstile token required' }, { status: 400 });
		}

		const ip = req.headers.get('CF-Connecting-IP') || '';
		const turnstileValid = await verifyTurnstile(token, env.TURNSTILE_KEY, ip);
		if (!turnstileValid) {
			return Response.json({ error: 'turnstile verification failed' }, { status: 400 });
		}

		const [limitName, limitContent] = await Promise.all([
			env.GUESTBOOK_LIMITER.limit({ key: name }),
			env.GUESTBOOK_LIMITER.limit({ key: content })
		]);

		if (!limitName.success || !limitContent.success) {
			return Response.json(
				{ error: `rate limited ${limitName.success} ${limitContent.success}` },
				{ status: 429, headers: { 'Retry-After': '60' } }
			);
		}
		if (!name || !content) {
			return Response.json({ error: 'name and message are required' }, { status: 400 });
		}
		if (name.length > 64) {
			return Response.json({ error: `name exceeds 64 characters` }, { status: 400 });
		}
		if (new TextEncoder().encode(content).length > 1024) {
			return Response.json({ error: `message content exceeds 1024 bytes` }, { status: 400 });
		}

		const pending =
			profanity.hasMatch(name) ||
			profanity.hasMatch(content) ||
			linkPattern.test(name) ||
			linkPattern.test(content);

		await env.D1.prepare(
			'INSERT INTO Messages (Messager, MessageContent, MessagePending, MessageDate) VALUES (?, ?, ?, ?)'
		)
			.bind(name, content, pending ? 1 : 0, new Date().toISOString())
			.run();

		return Response.json({ ok: true, pending });
	}

	if (request.method === 'POST') {
		return handlePostGuestbook(request);
	}

	return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST' } });
}
