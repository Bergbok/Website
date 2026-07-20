<script setup lang="ts">
import OSMO from '@assets/audio/OSMO.opus';
import DoGA from '@assets/images/doga.gif';
import traf from '@assets/images/traf.avif';
import AppWindow from '@compunents/AppWindow.vue';
import shapeSdfUrl from '@assets/images/sdf/picmin.bin?url';
import startreksucks from '@assets/images/startreksucks.avif';
import { Howl } from 'howler';
import { computed, ref, watch } from 'vue';
import { useAppOpen } from '@composables/useApp.ts';
import { get, useFetch, useTimeAgo } from '@vueuse/core';
import type { HardwareResponse } from '@typings/dashdot.d.ts';

interface AboutData {
	about?: string[];
	likes: string[];
	dislikes: string[];
	hates?: string[];
	hosted?: { name: string; url?: string }[];
}

const { appOpenListeners, isOpen } = useAppOpen();

const { data: me, execute: fetchAbout } = useFetch('/about', {
	immediate: false
}).json<AboutData>();

const { data: dashᱹdata, execute: fetchDashdot } = useFetch('/deep-thought/hardware', {
	immediate: false
}).json<HardwareResponse>();

const { data: visits, execute: fetchVisits } = useFetch('/visits', {
	immediate: false
});

function formatSpeed(bps: number | undefined): string {
	if (bps === undefined) {
		return '-';
	}
	if (bps >= 1_000_000_000) {
		return `${(bps / 1_000_000_000).toFixed(1)} Gbps`;
	}
	if (bps >= 1_000_000) {
		return `${(bps / 1_000_000).toFixed(0)} Mbps`;
	}
	return `${(bps / 1000).toFixed(0)} Kbps`;
}

const dashᱹcomputed = {
	uptime: computed(() => {
		const seconds = get(dashᱹdata)?.os.uptime;
		if (!seconds) {
			return null;
		}
		const days = Math.floor(seconds / 86_400);
		const hours = Math.floor((seconds % 86_400) / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const parts: string[] = [];
		if (days) {
			parts.push(`${days}d`);
		}
		if (hours) {
			parts.push(`${hours}h`);
		}
		if (minutes) {
			parts.push(`${minutes}m`);
		}
		return parts.join(' ') || '<1m';
	}),
	ram: {
		available: computed(() => {
			const size = get(dashᱹdata)?.ram.size;
			if (!size) {
				return null;
			}
			return (size / 1_073_741_824).toFixed(1);
		}),
		used: computed(() => {
			const load = get(dashᱹdata)?.ram.load;
			if (load === undefined) {
				return null;
			}
			return (load / 1_073_741_824).toFixed(1);
		})
	},
	cpu: {
		load: computed(() => {
			const loads = get(dashᱹdata)?.cpu.load;
			if (!loads?.length) {
				return null;
			}
			return (loads.reduce((sum, c) => sum + c.load, 0) / loads.length).toFixed(1);
		})
	},
	network: {
		down: computed(() => formatSpeed(get(dashᱹdata)?.network.speedDown)),
		up: computed(() => formatSpeed(get(dashᱹdata)?.network.speedUp)),
		testTime: useTimeAgo(
			computed(() => {
				const ts = get(dashᱹdata)?.network.lastSpeedTest;
				return ts ? new Date(ts) : new Date();
			})
		)
	}
};

const buttonsMetadata: Record<string, { ignore?: boolean; href?: string; title?: string }> = {
	bestviewedwithopeneyes: {
		title: 'Best viewed with OPEN EYES'
	},
	crouton: {
		href: 'https://crouton.net'
	},
	computer: {
		href: globalThis.location.href,
		title: 'Best viewed with A COMPUTER'
	},
	crystals: {
		href: 'https://iasos.com/crystals',
		title: 'CRYSTALS Now!'
	},
	dax: {
		title: '...'
	},
	eightyeightthirtyone: {
		href: 'https://eightyeightthirty.one',
		title: 'eightyeightthirty.one'
	},
	firefox: {
		href: 'https://firefox.com',
		title: 'Firefox'
	},
	flashpoint: {
		href: 'https://flashpointarchive.org',
		title: 'Flashpoint'
	},
	folder: {
		ignore: true
	},
	frutigeraeroarchive: {
		href: 'https://frutigeraeroarchive.org',
		title: 'Frutiger Aero Archive'
	},
	goofyjuice: {
		title: 'drink water!'
	},
	gongo: {
		href: 'https://github.com/Gongosoft',
		title: 'Gongo'
	},
	ihatetheimperialsystem: {
		title: 'I HATE INCHES I HATE FEET I HATE YARDS I HATE MILES I HATE POUNDS I HATE OUNCES I HATE PINTS I HATE GALLONS I HATE THE IMPERIAL SYSTEM'
	},
	internetarchive: {
		href: 'https://archive.org/details/@berg_bok/lists',
		title: 'Internet Archive'
	},
	imissXP: {
		title: 'I miss XP!'
	},
	internetexplerror: {
		title: 'NEVER Internet Explerror'
	},
	internetprivacy: {
		href: 'https://proton.me',
		title: 'Internet Privacy NOW!'
	},
	isitslowsayso: {
		href: 'https://github.com/Bergbok/Computer/issues',
		title: 'Is it SLOW? SAY SO!'
	},
	izzy: {
		href: 'https://izzys.casa',
		title: 'Izzy Muerte'
	},
	kde: {
		href: 'https://kde.org',
		title: 'KDE now!'
	},
	miniclip: {
		href: 'https://web.archive.org/web/20100420215434/http://www.miniclip.com/games/en/',
		title: 'Miniclip'
	},
	notmobilefriendly: {
		title: 'NOT MOBILE FRIENDLY'
	},
	uhhmo: {
		title: 'OSMO'
	},
	tildetown: {
		href: 'https://tilde.town',
		title: 'tilde.town'
	},
	twitch: {
		href: 'https://twitch.tv/bergbok',
		title: 'Twitch'
	},
	voidstranger: {
		href: '/???',
		title: '???'
	}
};

const buttons88x31 = Object.entries(
	import.meta.glob<string>('@assets/images/88x31/*', {
		eager: true,
		import: 'default'
	})
).flatMap(([path, url]) => {
	const filename = path.split('/').pop()!.split('.').slice(0, -1).join('.');
	const metadata = buttonsMetadata[filename] ?? null;
	if (metadata?.ignore) {
		return [];
	}
	return { url, name: metadata?.title ?? filename, href: metadata?.href ?? null };
});

const shuffledButtons = ref(buttons88x31);

const osmOOOO = new Howl({
	src: OSMO,
	format: ['opus'],
	volume: 0.42
});

watch(isOpen, (nowOpen) => {
	if (!nowOpen) {
		return;
	}
	fetchVisits();
	fetchAbout();
	fetchDashdot();
	const result = [...buttons88x31];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = result[i]!;
		result[i] = result[j]!;
		result[j] = tmp;
	}
	shuffledButtons.value = result;
});
</script>

<template>
	<AppWindow app-i-d="readme" :shader-options="{ shapeSdfUrl }" v-on="appOpenListeners">
		<section class="body">
			<p class="intro">
				hi. hope you like my website. if you do give it a star
				<a href="https://github.com/Bergbok/Computer" target="_blank"> on github</a> :)
			</p>

			<details>
				<summary>about me</summary>

				<ul v-if="me?.about?.length" class="inline-list">
					<li v-for="item in me.about" :key="item">{{ item }}</li>
				</ul>

				<h3 v-if="me?.likes?.length">i like (or used to like):</h3>
				<ul v-if="me?.likes?.length" class="inline-list">
					<li v-for="item in me!.likes" :key="item">{{ item }}</li>
				</ul>

				<details v-if="me?.hosted?.length" class="self-hosting" open>
					<summary>self-hosting</summary>
					<p>i host most things on an old {{ dashᱹdata?.os.arch }} {{ dashᱹdata?.os.platform }} computer</p>

					<dl v-if="dashᱹdata" class="hardware-info">
						<dt>CPU</dt>
						<dd id="cpu-info">
							{{ dashᱹdata.cpu.brand }}
							{{ dashᱹdata.cpu.model }}
							<span v-if="dashᱹcomputed.cpu.load">({{ dashᱹcomputed.cpu.load }}%)</span>
						</dd>

						<dt>GPU</dt>
						<dd v-if="dashᱹdata.gpu.layout[0]" id="gpu-info">
							{{ dashᱹdata.gpu.layout[0].brand }} {{ dashᱹdata.gpu.layout[0].model }}
							<span v-if="dashᱹdata.gpu.load[0]">({{ dashᱹdata.gpu.load[0].load }}%)</span>
						</dd>
						<dd v-else>-</dd>

						<dt>RAM</dt>
						<dd>{{ dashᱹcomputed.ram.used }} / {{ dashᱹcomputed.ram.available }} GB</dd>

						<dt>network</dt>
						<dd>
							↓ {{ dashᱹcomputed.network.down }} &nbsp; ↑ {{ dashᱹcomputed.network.up }} (checked
							{{ dashᱹcomputed.network.testTime }})
						</dd>

						<dt>uptime</dt>
						<dd>{{ dashᱹcomputed.uptime }}</dd>
					</dl>
					<div v-else class="hardware-info">server offline :|</div>

					<ul class="apps-list">
						<li v-for="app in me.hosted" :key="app.name">
							<a v-if="app.url" :href="app.url">{{ app.name }}</a>
							<template v-else>{{ app.name }}</template>
						</li>
					</ul>
				</details>

				<h3 v-if="me?.dislikes?.length">i dislike:</h3>
				<ul v-if="me?.dislikes?.length" class="inline-list">
					<li v-for="item in me!.dislikes" :key="item">{{ item }}</li>
				</ul>

				<details v-if="me?.hates?.length">
					<summary>i <strong>hate</strong>:</summary>
					<ul class="inline-list">
						<li v-for="item in me!.hates" :key="item">{{ item }}</li>
					</ul>
				</details>
			</details>

			<div class="buttons">
				<template v-for="button in shuffledButtons" :key="button.name">
					<a
						v-if="button.href"
						:href="button.href"
						:title="button.name"
						:target="button.href.startsWith('/') ? undefined : '_blank'">
						<img :src="button.url" :alt="button.name" width="88" height="31" />
					</a>
					<img
						v-else
						:src="button.url"
						:alt="button.name"
						:title="button.name"
						width="88"
						height="31"
						@click="button.name === 'OSMO' && osmOOOO.play()" />
				</template>
			</div>

			<div class="images">
				<img :src="traf" alt="TRAF - NOW READ IT BACKWARDS" height="42" title="hehe" />
				<a href="https://startreksucks.com">
					<img :src="startreksucks" alt="star trek sucks" height="42" />
				</a>
				<a href="https://archive.org/search?query=creator%3A%22Project+Team+DoGA%22">
					<img :src="DoGA" alt="doga" height="42" />
				</a>
			</div>

			<footer>
				<p v-if="visits !== null">this page has been viewed {{ visits }} times</p>
				<p v-else>loading views...</p>
			</footer>
		</section>
	</AppWindow>
</template>

<style scoped>
.body {
	padding: 10px 12px;
	display: flex;
	flex-direction: column;
	gap: 12px;
	height: 100%;
	box-sizing: border-box;
	overflow-y: auto;
	user-select: text;

	& .intro {
		margin: 0;
		text-align: center;
	}

	& .buttons {
		display: grid;
		grid-template-columns: repeat(auto-fill, 88px);
		gap: 4px;
		justify-content: center;

		& a {
			display: block;
			line-height: 0;
		}

		& img {
			display: block;
			width: 88px;
			height: 31px;
			image-rendering: pixelated;
		}
	}

	& .images {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		justify-content: center;
		align-items: center;

		& a {
			display: block;
			line-height: 0;
		}

		& img {
			max-height: 42px;
			object-fit: contain;
		}
	}

	& details {
		& h3 {
			font-size: 0.95em;
			margin: 10px 0 4px;
		}

		& p {
			margin: 4px 0;
		}

		& ul {
			margin: 0;
			padding-left: 20px;
		}

		& li {
			line-height: 1.5;
		}
	}

	& .self-hosting {
		margin-top: 8px;
		padding-left: 16px;
	}

	& .hardware-info {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 4px 10px;
		margin: 6px 0 10px;
		padding: 8px 12px;
		background: #dadada69;
		border-radius: 6px;

		& dt {
			font-weight: 600;
			color: #696969;
			text-align: end;
		}

		& dd {
			margin: 0;

			&#cpu-info,
			&#gpu-info {
				text-transform: lowercase;
			}
		}
	}

	& .inline-list {
		display: flex;
		flex-wrap: wrap;
		gap: 2px 8px;
		padding: 0 0 0 16px !important;
		list-style: none;

		& li::after {
			content: ',';
		}

		& li:last-child::after {
			content: '';
		}
	}

	& .apps-list {
		display: flex;
		flex-wrap: wrap;
		gap: 2px 8px;
		padding: 0 !important;
		list-style: none;

		& li {
			&::after {
				content: ',';
			}

			&:first-child::before {
				content: 'i host ';
			}

			&:last-child::after {
				content: ' among other things';
			}

			&:nth-last-child(2)::after {
				content: ' &';
			}
		}

		& a {
			color: inherit;
			text-decoration: underline dotted;
			text-underline-offset: 3px;
		}
	}

	& footer {
		text-align: center;
		font-size: 0.85em;
		opacity: 0.7;

		& p {
			margin: 0;
		}
	}
}
</style>
