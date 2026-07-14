import CloudflareAPI from 'cloudflare';
import { env } from 'cloudflare:workers';
import { handleGuestbook } from './guestbook.ts';
import { getTwitchLiveChannels } from './twitch.ts';
import type { CpuLoad, GpuLoad, HardwareInfo, HardwareResponse, RamLoad } from '@typings/dashdot.d.ts';

export { Tally } from './tally.ts';
export { Diablo } from './diablo.ts';
export { HydraServer } from './hydra.ts';

const cats = Object.values(
	import.meta.glob<string>('@assets/images/cats/*', {
		eager: true,
		import: 'default',
		query: '?no-inline'
	})
);

const cf = { cacheEverything: true, cacheTtlByStatus: { '200-299': 86_400, '404': 60, '500-599': 0 } };

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const { pathname, searchParams } = url;

		if (pathname === '/') {
			const visitorCount = await env.KV.get('visitors');
			await env.KV.put('visitors', String(Number(visitorCount) + 1));
			return env.ASSETS.fetch(request);
		}

		if (pathname === '/about') {
			const about = await env.KV.get('about', { type: 'json' });
			return Response.json(about);
		}

		if (pathname === '/cat') {
			const cat = new URL(cats[Math.floor(Math.random() * cats.length)]!, request.url);
			return Response.redirect(cat.toString(), 302);
		}

		if (pathname.startsWith('/deep-thought/')) {
			const route = pathname.slice('/deep-thought/'.length);
			if (route === 'answer') {
				return new Response('42');
			}
			// https://getdashdot.com/docs/integration/api
			if (route === 'hardware') {
				const dashᱹ = 'http://dash.bergbok.computer';
				const [hw, cpuLoad, gpuLoad, ramLoad] = await Promise.all([
					env.DASHDOT.fetch(`${dashᱹ}/info`).then(async (response) => response.json<HardwareInfo>()),
					env.DASHDOT.fetch(`${dashᱹ}/load/cpu`).then(async (response) => response.json<CpuLoad>()),
					env.DASHDOT.fetch(`${dashᱹ}/load/gpu`).then(async (response) => response.json<GpuLoad>()),
					env.DASHDOT.fetch(`${dashᱹ}/load/ram`).then(async (response) => response.json<RamLoad>())
				]);

				return Response.json({
					os: { arch: hw.os.arch, platform: hw.os.platform, uptime: hw.os.uptime },
					cpu: { ...hw.cpu, load: cpuLoad },
					gpu: { ...hw.gpu, load: gpuLoad.layout },
					ram: { size: hw.ram.size, load: ramLoad.load },
					network: { ...hw.network }
				} satisfies HardwareResponse);
			}
		}

		if (pathname === '/diablo-relay') {
			return env.DIABLO.get(env.DIABLO.idFromName('lobby')).fetch(request);
		}

		if (pathname.startsWith('/eightyeightthirtyone/badge/')) {
			const badgeID = pathname.slice('/eightyeightthirtyone/badge/'.length);
			return fetch(`https://highway.eightyeightthirty.one/badge/${badgeID}`, { cf });
		}

		if (pathname === '/eightyeightthirtyone/graph.json') {
			return fetch('https://eightyeightthirty.one/graph.json', { cf });
		}

		if (pathname.startsWith('/guestbook/')) {
			return handleGuestbook(request, env);
		}

		if (pathname === '/hydra-server') {
			return env.HYDRA.get(env.HYDRA.idFromName(searchParams.get('room') || 'computer')).fetch(request);
		}

		if (pathname === '/livestreams') {
			try {
				const ttv = await getTwitchLiveChannels(
					(searchParams.get('channels') || (await env.KV.get('twitch')))?.split(',').filter(Boolean) ?? []
				);
				return Response.json({ ttv });
			} catch {
				return Response.json({ ttv: [] });
			}
		}

		if (pathname.startsWith('/noclip/assets/')) {
			return fetch(`https://z.noclip.website/${pathname.slice('/noclip/assets/'.length)}`, { cf });
		}

		if (pathname.startsWith('/r2/')) {
			const object = await env.R2.get(pathname.slice('/r2/'.length));
			if (!object) {
				return new Response('sorry bro\n\nfile is still being worked on\n\nkeep distance', { status: 404 });
			}
			const headers = new Headers();
			object.writeHttpMetadata(headers);
			headers.set('etag', object.httpEtag);
			return new Response('body' in object ? object.body : undefined, {
				status: 'body' in object ? 200 : 412,
				headers
			});
		}

		if (pathname.startsWith('/releases/')) {
			const upstream = await fetch(`https://editor.godotengine.org${pathname}`, { cf });
			const proxy = new Response(upstream.body, upstream);
			proxy.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
			proxy.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
			return proxy;
		}

		if (pathname.startsWith('/steam/widget/')) {
			const id = pathname.slice('/steam/widget/'.length);
			const upstream = await fetch(`https://store.steampowered.com/widget/${id}${url.search}`, {
				cf: { ...cf, cacheTtlByStatus: { ...cf.cacheTtlByStatus, '200-299': 1800 } }
			});
			const proxy = new Response(upstream.body, upstream);
			proxy.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
			proxy.headers.delete('Content-Security-Policy');
			return proxy;
		}

		if (pathname === '/tally') {
			return env.TALLY.get(env.TALLY.idFromName('global')).fetch(request);
		}

		if (pathname === '/teapot') {
			if ((await env.KV.get('teapot')) === 'true') {
				return new Response("I'm a teapot", { status: 418 });
			}
			return new Response('Out of Coffee', { status: 503 });
		}

		if (pathname === '/twitch.js') {
			return fetch('https://player.twitch.tv/js/embed/v1.js', { cf });
		}

		if (pathname === '/version') {
			return Response.json(env.CF_VERSION_METADATA);
		}

		if (pathname === '/v86/windowsxp/hdd.img') {
			const init: RequestInit = { cf, method: request.method };
			const range = request.headers.get('range');
			if (range) {
				init.headers = { range };
			}
			return fetch(`https://oses.ioblako.com/OSes/windowsxp/hdd.img`, init);
		}

		if (pathname === '/v86/windows7/hdd.img') {
			const init: RequestInit = { cf, method: request.method };
			const range = request.headers.get('range');
			if (range) {
				init.headers = { range };
			}
			const fileID =
				'4_zf0e386b7a1df37119e870a10_f2050208dd46a3b88_d20250722_m103240_c003_v0312024_t0057_u01753180360888';
			return fetch(`https://f003.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=${fileID}`, init);
		}

		if (pathname.startsWith('/v86/')) {
			return fetch(`https://i.copy.sh/${pathname.slice('/v86/'.length)}`, { cf });
		}

		if (pathname.startsWith('/visits')) {
			return new Response(await env.KV.get('visitors'));
		}

		return env.ASSETS.fetch(request);
	},
	async scheduled(controller: ScheduledController): Promise<void> {
		if (controller.cron === '0/5 * * * *') {
			const api = new CloudflareAPI({
				apiToken: env.ACCESS_API_TOKEN
			});

			const gaming = await api.zeroTrust.access.applications.get(env.ACCESS_APP_ID, {
				zone_id: env.ACCESS_ZONE_ID
			});

			if (
				gaming.policies?.find((p) => p.decision === 'bypass' && p.include?.some((i) => 'everyone' in i)) &&
				(await env.KV.get('teapot')) === 'false'
			) {
				await env.KV.put('teapot', 'true');
			}
		}
	}
} satisfies ExportedHandler<Env>;
