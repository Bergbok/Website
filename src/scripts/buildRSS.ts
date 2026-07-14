import RSS from 'rss';
import { resolve } from 'path';
import { statSync } from 'node:fs';
import type { Plugin } from 'vite';

export default function buildRSS(): Plugin {
	return {
		name: 'build-rss',
		apply: 'build',
		generateBundle() {
			const feed = new RSS({
				description: '( ͡° ͜ʖ ͡°)',
				feed_url: 'https://bergbok.computer/rss',
				generator: 'computer',
				image_url: 'https://bergbok.computer/favicon/favicon.webp',
				language: 'en-ZA',
				managingEditor: 'bergbok',
				site_url: 'https://bergbok.computer',
				title: 'bergbok',
				webMaster: 'bergbok'
			});

			feed.item({
				guid: '1',
				date: new Date(2026, 5, 25, 19, 42),
				title: 'hi',
				description: 'if i feel like sharing something i might do it here!',
				url: 'https://bergbok.computer/rss'
			});

			feed.item({
				guid: '2',
				date: new Date(2026, 5, 25, 19, 50),
				title: ':)',
				description: ':P',
				url: 'https://bergbok.computer/funnyvideo',
				enclosure: {
					url: 'https://bergbok.computer/rickroll.webm',
					size: statSync(resolve(import.meta.dirname, '../assets/video/rickroll.webm')).size,
					type: 'video/webm'
				}
			});

			this.emitFile({
				type: 'asset',
				fileName: 'rss.xml',
				source: feed.xml({ indent: '\t' })
			});
		}
	};
}
