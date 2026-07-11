import { env } from 'cloudflare:workers';

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getTwitchAccessToken(): Promise<string> {
	if (cachedToken && Date.now() < cachedToken.expiresAt) {
		return cachedToken.value;
	}
	const res = await fetch('https://id.twitch.tv/oauth2/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: env.TWITCH_CLIENT_ID,
			client_secret: env.TWITCH_CLIENT_SECRET,
			grant_type: 'client_credentials'
		})
	});
	const { access_token, expires_in } = (await res.json()) as { access_token: string; expires_in: number };
	cachedToken = { value: access_token, expiresAt: Date.now() + (expires_in - 60) * 1000 };
	return cachedToken.value;
}

export async function getTwitchLiveChannels(channels: string[]): Promise<string[]> {
	if (!channels.length) {
		return [];
	}
	const token = await getTwitchAccessToken();
	const params = new URLSearchParams({ type: 'live', first: '100' });
	for (const ch of channels) {
		params.append('user_login', ch);
	}
	const res = await fetch(`https://api.twitch.tv/helix/streams?${params}`, {
		headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': env.TWITCH_CLIENT_ID }
	});
	const { data } = (await res.json()) as { data: { user_login: string }[] };
	const liveLogins = new Set(data.map((s) => s.user_login.toLowerCase()));
	return channels.filter((ch) => liveLogins.has(ch.toLowerCase()));
}
