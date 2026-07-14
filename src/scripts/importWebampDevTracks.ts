import type { URLTrack } from 'webamp';

export function execute(): URLTrack[] {
	return Object.entries(
		import.meta.glob<string>(['./*', '!./README.md'], {
			base: '../assets/audio/dev',
			eager: true,
			import: 'default',
			query: '?url'
		})
	).map(([path, url]) => ({
		url,
		metaData: {
			artist: '',
			title: path
				.replace(/\.\/[\d\s]+/, '')
				.split('.')
				.shift()
		}
	})) as URLTrack[];
}
