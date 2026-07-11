import { createTarGzip, parseTarGzip } from 'nanotar';

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const upstream = await fetch(`https://windows93.net${url.pathname}${url.search}`, {
			cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': 86_400, '404': 60, '500-599': 0 } }
		} as RequestInit);

		const proxied = new Response(upstream.body, upstream);
		proxied.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

		if (url.pathname === '/42/core.js') {
			const body = (await proxied.text()).replace('window.name = ""', 'window.name = "desktop"');
			const patched = new Response(body, { status: proxied.status, headers: proxied.headers });
			patched.headers.delete('Content-Encoding');
			patched.headers.delete('Content-Length');
			return patched;
		}

		if (url.pathname === '/42.tar.gz' && proxied.body) {
			const files = await parseTarGzip(await new Response(proxied.body).arrayBuffer());
			for (const f of files) {
				if (f.type === 'file' && (f.name === '42/core.js' || f.name.endsWith('/42/core.js'))) {
					f.data = new TextEncoder().encode((f.text ?? '').replace('window.name = ""', 'window.name = "desktop"'));
					break;
				}
			}
			const patchedBytes = await createTarGzip(files);
			const patched = new Response(patchedBytes as BodyInit, {
				status: proxied.status,
				headers: proxied.headers
			});
			patched.headers.set('Content-Length', String(patchedBytes.byteLength));
			return patched;
		}

		return proxied;
	}
} satisfies ExportedHandler;
