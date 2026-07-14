import type { AppEntry } from '@typings/apps.d.ts';

export function defineApps<const T extends Record<string, AppEntry>>(apps: T): T {
	const seen = new Map<string, string>();
	for (const [id, entry] of Object.entries(apps)) {
		const key = `${entry.position.x},${entry.position.y}`;
		const conflict = seen.get(key);
		if (conflict) {
			throw new Error(
				`[defineApps] Duplicate grid position (${entry.position.x}, ${entry.position.y}) ` +
					`shared by "${conflict}" and "${id}"`
			);
		}
		seen.set(key, id);
	}
	return apps;
}
