import { defineAsyncComponent, h } from 'vue';
import { defineApps } from '@compunents/apps/defineApps.ts';
import type { Component } from 'vue';
import type {
	AppEntry,
	IFrameAppOptions,
	NeonShaderOptions,
	RuffleAppOptions,
	V86AppOptions
} from '@typings/apps.d.ts';
import * as ـ from './assets.ts';

const access = (await fetch('/teapot')).status === 418;

export const APPS = defineApps({
	animalcrossing: {
		label: 'Animal Crossing',
		component: iframe({
			appID: 'animalcrossing',
			iframeOptions: { src: '/animalcrossing' }
		}),
		icon: ـ.animalcrossing,
		position: { x: 0, y: 2, width: 960, height: 720 }
	},
	arch: {
		label: 'Arch',
		component: v86({
			appID: 'arch',
			v86Options: {
				filesystem: { baseurl: '/v86/arch/' },
				initial_state: { url: ـ.archState },
				memory_size: 512 * 1024 * 1024,
				net_device: { type: 'virtio' },
				vga_memory_size: 8 * 1024 * 1024
			}
		}),
		icon: ـ.arch,
		position: { x: 7, y: 8, width: 1024, height: 777 }
	},
	arxfatalis: {
		label: 'Arx Fatalis',
		component: iframe({
			appID: 'arxfatalis',
			iframeOptions: { src: 'https://arxfatalis.bergbok.party' }
		}),
		icon: ـ.arxfatalis,
		position: { x: 0, y: 5, width: 960, height: 640 }
	},
	audiorbits: {
		label: 'AudiOrbits',
		component: iframe({
			appID: 'audiorbits',
			iframeOptions: { src: '/audiorbits' }
		}),
		icon: ـ.audiorbits,
		position: { x: 4, y: 0, width: 1024, height: 576 }
	},
	bassoontracker: {
		label: 'Bassoon Tracker',
		component: iframe({
			appID: 'bassoontracker',
			iframeOptions: { src: '/bassoontracker' }
		}),
		icon: ـ.bassoontracker,
		position: { x: 4, y: 6, width: 800, height: 600 }
	},
	bluesky: {
		label: 'Bluesky',
		link: 'https://bsky.app/profile/bergbok.computer',
		icon: {
			icon: ـ.bluesky,
			shaderOptions: {
				glowColor: '#1185FE',
				shapeSdfUrl: ـ.blueskySDF
			}
		},
		position: { x: 11, y: 1 }
	},
	cats: {
		label: 'cats',
		component: defineAsyncComponent(async () => import('@compunents/apps/Cats.vue')),
		position: { x: 4, y: 4 },
		route: false
	},
	celeste: {
		label: 'Celeste',
		component: iframe({
			appID: 'celeste',
			iframeOptions: { src: '/celeste' }
		}),
		icon: ـ.celeste,
		position: { x: 1, y: 2, width: 1024, height: 675 }
	},
	clubpenguin: {
		label: 'Club Penguin',
		component: iframe({
			appID: 'clubpenguin',
			iframeOptions: { src: 'https://penguin.bergbok.party' }
		}),
		icon: ـ.penguin,
		position: { x: 0, y: 1, width: 1024, height: 768 }
	},
	crossyroad: {
		label: 'Crossy Road',
		component: iframe({
			appID: 'crossyroad',
			iframeOptions: { src: '/crossyroad' }
		}),
		icon: ـ.crossyroad,
		position: { x: 3, y: 3 }
	},
	cs: {
		label: 'Counter-Strike',
		...accessApp('cs', { src: 'https://counter-strike.bergbok.party' }),
		icon: ـ.counterstrike,
		position: { x: 0, y: 4, width: 1024, height: 768 }
	},
	cuphead: {
		label: 'Cuphead',
		...accessApp('cuphead', { src: 'https://cuphead.bergbok.party' }),
		icon: ـ.cuphead,
		position: { x: 5, y: 1, width: 1024, height: 576 }
	},
	destroyer: {
		label: 'Desktop Destroyer',
		component: defineAsyncComponent(async () => import('@compunents/apps/DomainDestroyer.vue')),
		icon: ـ.desktopdestroyer,
		position: { x: 2, y: 7 },
		route: false
	},
	diablo: {
		label: 'Diablo',
		component: iframe({
			appID: 'diablo',
			iframeOptions: { src: '/diablo' }
		}),
		icon: ـ.diablo,
		position: { x: 8, y: 3, width: 1024, height: 768 }
	},
	discord: {
		label: 'Discord',
		link: 'https://discord.com/users/223797450354327552',
		icon: {
			icon: ـ.discord,
			shaderOptions: {
				glowColor: '#5865F2',
				shapeSdfUrl: ـ.discordSDF
			}
		},
		position: { x: 10, y: 3 }
	},
	doom: {
		label: { icon: 'DOOM', window: 'FreeDOOM' },
		component: iframe({
			appID: 'doom',
			iframeOptions: { src: '/doom' }
		}),
		icon: ـ.doom,
		position: { x: 1, y: 5, width: 1024, height: 576 }
	},
	doom3: {
		label: { icon: 'DOOM 3', window: 'DOOM 3 Demo' },
		component: iframe({
			appID: 'doom3',
			iframeOptions: { src: 'https://doom3.bergbok.party' }
		}),
		icon: ـ.doom3,
		position: { x: 2, y: 5, width: 960, height: 640 }
	},
	eightyeightthirtyone: {
		label: { icon: '88x31', window: 'eightyeightthirtyone' },
		component: defineAsyncComponent(async () => import('@compunents/apps/EightyEightThirtyOne.vue')),
		icon: ـ.eightyeightthirtyone,
		position: { x: 7, y: 6, width: 1100, height: 650 },
		persistent: true
	},
	email: {
		label: 'Email',
		link: 'mailto:contact@bergbok.computer',
		icon: {
			icon: ـ.at,
			shaderOptions: { shapeSdfUrl: ـ.atSDF }
		},
		position: { x: 10, y: 2 }
	},
	fluidpaint: {
		label: 'Fluid Paint',
		component: iframe({
			appID: 'fluidpaint',
			iframeOptions: { src: '/fluidpaint' }
		}),
		icon: ـ.fluidpaint,
		position: { x: 0, y: 6, width: 1024, height: 576 },
		persistent: true
	},
	fluids: {
		label: 'Fluid Simulation',
		component: defineAsyncComponent(async () => import('@compunents/apps/Fluids.vue')),
		icon: ـ.fluidsimulation,
		position: { x: 1, y: 0, width: 1024, height: 622 }
	},
	geometrydash: {
		label: 'Geometry Dash',
		component: iframe({
			appID: 'geometrydash',
			iframeOptions: { src: '/geometrydash' }
		}),
		icon: ـ.geometrydash,
		position: { x: 0, y: 3 }
	},
	github: {
		label: 'GitHub',
		link: 'https://github.com/Bergbok/Website',
		icon: {
			icon: ـ.github,
			shaderOptions: { glowColor: '#fff', shapeSdfUrl: ـ.githubSDF }
		},
		position: { x: 11, y: 0 }
	},
	glados: {
		label: 'GLaDOS',
		component: v86({
			appID: 'glados',
			v86Options: { fda: { url: ـ.stillaliveosFloppy, size: 368_640 } }
		}),
		icon: ـ.glados,
		position: { x: 1, y: 8, width: 770, height: 600 }
	},
	godot: {
		label: 'Godot',
		component: iframe({
			appID: 'godot',
			iframeOptions: { src: '/godot/godot.editor.html' }
		}),
		icon: ـ.godot,
		position: { x: 2, y: 8, width: 1024, height: 576 },
		persistent: true
	},
	gongo: {
		label: {
			icon: 'Gongo',
			window: 'Gongo is a 2D side-scrolling platformer where the player goes through levels killing enemies and saving the princess. Each level has amazing hand-picked worlds. On each of the levels, a princess is hidden, which must be rescued and delivered to your castle, cleaning up enemies along the way.'
		},
		component: iframe({
			appID: 'gongo',
			iframeOptions: { src: 'https://gongo.bergbok.party' }
		}),
		icon: ـ.gongo,
		position: { x: 8, y: 2, width: 1024, height: 576 },
		persistent: true
	},
	gpuio: {
		label: 'gpu-io',
		component: defineAsyncComponent(async () => import('@compunents/apps/GpuIO.vue')),
		icon: ـ.gpuio,
		position: { x: 3, y: 8, width: 800, height: 680 }
	},
	gtavc: {
		label: { icon: 'GTA: Vice City', window: 'Grand Theft Auto: Vice City' },
		...accessApp('gtavc', { src: 'https://gtavc.bergbok.party' }),
		icon: ـ.gtavc,
		position: { x: 6, y: 2, width: 1024, height: 768 }
	},
	guestbook: {
		label: 'Guestbook',
		component: defineAsyncComponent(async () => import('@compunents/apps/Guestbook.vue')),
		icon: ـ.soapstone,
		position: { x: 9, y: 8, width: 800, height: 560, minWidth: 200 }
	},
	happywheels: {
		label: 'Happy Wheels',
		component: iframe({
			appID: 'happywheels',
			iframeOptions: { src: 'https://happywheels.bergbok.party' }
		}),
		icon: ـ.happywheels,
		position: { x: 1, y: 3, width: 1024, height: 569 }
	},
	halflife: {
		label: 'Half-Life',
		...accessApp('halflife', { src: 'https://half-life.bergbok.party' }),
		icon: ـ.halflife,
		position: { x: 1, y: 4, width: 1024, height: 768 }
	},
	halflife2: {
		label: 'Half-Life 2',
		...accessApp('halflife2', { src: 'https://half-life-2.bergbok.party' }),
		icon: ـ.halflife2,
		position: { x: 2, y: 4, width: 1024, height: 768 }
	},
	hollowknight: {
		label: 'Hollow Knight',
		...accessApp('hollowknight', { src: 'https://hollowknight.bergbok.party' }),
		icon: ـ.hollowknight,
		position: { x: 7, y: 1, width: 1024, height: 576 }
	},
	hollowknightsilksong: {
		label: { icon: 'Silksong', window: 'Hollow Knight: Silksong' },
		...accessApp('hollowknightsilksong', { src: 'https://silksong.bergbok.party' }),
		icon: ـ.hollowknightsilksong,
		position: { x: 8, y: 1, width: 1024, height: 576 }
	},
	holomatch: {
		label: 'Star Trek: Holomatch',
		component: iframe({
			appID: 'holomatch',
			iframeOptions: { src: 'https://startreksucks.bergbok.party' }
		}),
		icon: ـ.holomatch,
		position: { x: 3, y: 5, width: 1024, height: 576 }
	},
	hydra: {
		label: 'Hydra',
		component: defineAsyncComponent(async () => import('@compunents/apps/Hydra.vue')),
		icon: ـ.hydra,
		position: { x: 6, y: 6, width: 800, height: 600 }
	},
	impossiblequiz: {
		label: 'Impossible Quiz',
		component: ruffle({
			appID: 'impossiblequiz',
			swfUrl: ـ.impossiblequizSWF
		}),
		icon: ـ.impossiblequiz,
		position: { x: 7, y: 4 }
	},
	internetarchive: {
		label: 'Internet Archive',
		link: 'https://archive.org/details/@berg_bok',
		icon: {
			icon: ـ.bank,
			shaderOptions: {
				glowColor: '#555555',
				shapeSdfUrl: ـ.bankSDF
			}
		},
		position: { x: 11, y: 6 }
	},
	jspaint: {
		label: 'Paint',
		component: iframe({
			appID: 'jspaint',
			iframeOptions: { src: '/jspaint' }
		}),
		icon: ـ.jspaint,
		position: { x: 0, y: 7, width: 800, height: 600 },
		persistent: true
	},
	kolibrios: {
		label: 'KolibriOS',
		component: v86({
			appID: 'kolibrios',
			v86Options: { fda: { url: ـ.kolibriosFloppy, size: 1_474_560 } },
			lockPointer: true
		}),
		icon: ـ.kolibrios,
		position: { x: 6, y: 8, width: 1024, height: 768 }
	},
	lain: {
		label: 'Lain',
		component: iframe({
			appID: 'lain',
			iframeOptions: { src: 'https://lain.bergbok.party' }
		}),
		icon: ـ.lain,
		position: { x: 0, y: 8, width: 1024, height: 768 }
	},
	lastfm: {
		label: 'Last.fm',
		link: 'https://www.last.fm/user/bergbok_',
		icon: {
			icon: ـ.lastfm,
			shaderOptions: {
				glowColor: '#D60801',
				shapeSdfUrl: ـ.lastfmSDF
			}
		},
		position: { x: 10, y: 4 }
	},
	lego: {
		label: 'LEGO',
		component: iframe({
			appID: 'lego',
			iframeOptions: { src: 'https://isle.pizza' }
		}),
		icon: ـ.legoIsland,
		position: { x: 0, y: 0, width: 960, height: 720 }
	},
	letterboxd: {
		label: 'Letterboxd',
		component: defineAsyncComponent(async () => import('@compunents/apps/Letterboxd.vue')),
		icon: ـ.letterboxd,
		position: { x: 11, y: 4 }
	},
	linux: {
		label: 'Linux',
		component: defineAsyncComponent(async () => import('@compunents/apps/Linux.vue')),
		icon: ـ.tux,
		position: { x: 8, y: 8, width: 800, height: 600 }
	},
	marbleblastgold: {
		label: 'Marble Blast Gold',
		component: iframe({
			appID: 'marbleblastgold',
			iframeOptions: { src: '/marbleblast/gold' }
		}),
		icon: ـ.marbleblastgold,
		position: { x: 3, y: 2 }
	},
	marbleblastplatinum: {
		label: 'Marble Blast Platinum',
		component: iframe({
			appID: 'marbleblastplatinum',
			iframeOptions: { src: '/marbleblast/platinum' }
		}),
		icon: ـ.marbleblastplatinum,
		position: { x: 5, y: 2 }
	},
	marbleblastultra: {
		label: 'Marble Blast Ultra',
		component: iframe({
			appID: 'marbleblastultra',
			iframeOptions: { src: '/marbleblast/ultra/' }
		}),
		icon: ـ.marbleblastultra,
		position: { x: 4, y: 2 }
	},
	matrix: {
		label: 'Matrix',
		component: defineAsyncComponent(async () => import('@compunents/apps/Matrix.vue')),
		icon: ـ.matrix,
		position: { x: 5, y: 0, width: 1024, height: 576 }
	},
	minecraft: {
		label: 'Minecraft',
		component: iframe({
			appID: 'minecraft',
			iframeOptions: { src: '/minecraft' }
		}),
		icon: ـ.minecraft,
		position: { x: 2, y: 1, width: 1024, height: 576 }
	},
	myanimelist: {
		label: 'MyAnimeList',
		link: 'https://myanimelist.net/profile/Bergbok',
		icon: {
			icon: ـ.mal,
			shaderOptions: {
				glowColor: '#2E51A2',
				shapeSdfUrl: ـ.malSDF
			}
		},
		position: { x: 10, y: 5 }
	},
	namegen: {
		label: 'Name Generator',
		component: defineAsyncComponent(async () => import('@compunents/apps/Namegen.vue')),
		icon: ـ.markovchain,
		position: { x: 2, y: 6, width: 660, height: 660 }
	},
	noclip: {
		label: 'noclip',
		component: iframe({
			appID: 'noclip',
			iframeOptions: { src: '/noclip' }
		}),
		icon: ـ.noclip,
		position: { x: 8, y: 6, width: 1024, height: 576 }
	},
	npm: {
		label: 'NPM',
		link: 'https://www.npmjs.com/~bergbok',
		icon: {
			icon: ـ.npm,
			shaderOptions: {
				glowColor: '#CB3837',
				shapeSdfUrl: ـ.npmSDF
			}
		},
		position: { x: 11, y: 7 }
	},
	oimo: {
		label: 'Oimo',
		component: defineAsyncComponent(async () => import('@compunents/apps/Oimo.vue')),
		icon: ـ.oimo,
		position: { x: 7, y: 2, width: 855, height: 480 }
	},
	omori: {
		label: 'OMORI',
		...accessApp('omori', { src: 'https://omori.bergbok.party' }),
		icon: ـ.omori,
		position: { x: 6, y: 1, width: 800, height: 600 }
	},
	openrct2: {
		label: { icon: 'OpenRCT2', window: 'Roller Coaster Tycoon 2' },
		component: iframe({
			appID: 'openrct2',
			iframeOptions: { src: '/openrct2' }
		}),
		icon: ـ.openrct2,
		position: { x: 5, y: 4, width: 800, height: 600 }
	},
	openttd: {
		label: { icon: 'OpenTTD', window: 'Transport Tycoon Deluxe' },
		component: iframe({
			appID: 'openttd',
			iframeOptions: { src: '/openttd' }
		}),
		icon: ـ.openttd,
		position: { x: 6, y: 4, width: 800, height: 600 }
	},
	osakaos: {
		label: 'osakaOS',
		component: v86({
			appID: 'osakaos',
			v86Options: {
				disable_jit: true,
				hda: { url: ـ.osakaosHDD },
				memory_size: 256 * 1024 * 1024,
				vga_memory_size: 8 * 1024 * 1024
			}
		}),
		icon: ـ.osakaos,
		position: { x: 4, y: 5, width: 800, height: 600 }
	},
	otcs: {
		label: { icon: 'OTCS', window: 'The Old Timey Computer Show' },
		component: defineAsyncComponent(async () => import('@compunents/apps/OldTimeyComputerShow.vue')),
		icon: ـ.otcs,
		position: { x: 4, y: 8, width: 800, height: 600 }
	},
	plantsvszombies: {
		label: { icon: 'Plants vs. Zombies', window: 'Plants vs. Zombies: GOTY Edition' },
		component: defineAsyncComponent(async () => import('@compunents/apps/PlantsVsZombies.vue')),
		icon: ـ.pvz,
		position: { x: 1, y: 1, width: 960, height: 720 },
		persistent: true
	},
	pinball: {
		label: { icon: '3D Pinball', window: '3D Pinball for Windows - Space Cadet' },
		component: defineAsyncComponent(async () => import('@compunents/apps/SpaceCadetPinball.vue')),
		icon: ـ.pinball,
		position: { x: 6, y: 7, width: 640, height: 450 },
		persistent: true
	},
	pipes: {
		label: '3D Pipes',
		component: iframe({
			appID: 'pipes',
			iframeOptions: { src: '/pipes/#{"hideUI":true}' }
		}),
		icon: ـ.pipes,
		position: { x: 5, y: 8, width: 640, height: 480 }
	},
	pixelsynth: {
		label: 'PIXELSYNTH',
		component: iframe({
			appID: 'pixelsynth',
			iframeOptions: { src: '/pixelsynth' }
		}),
		icon: ـ.pixelsynth,
		position: { x: 5, y: 6, width: 640, height: 480 }
	},
	pizzatower: {
		label: 'Pizza Tower',
		...accessApp('pizzatower', { src: 'https://pizzatower.bergbok.party' }),
		icon: ـ.pizzatower,
		position: { x: 6, y: 3, width: 1024, height: 576 }
	},
	portal: {
		label: 'Portal',
		...accessApp('portal', { src: 'https://portal.bergbok.party' }),
		icon: ـ.portal,
		position: { x: 3, y: 4, width: 800, height: 600 }
	},
	proton: {
		label: 'Proton',
		link: 'https://pr.tn/ref/R8DW559D',
		icon: {
			icon: ـ.proton,
			shaderOptions: {
				glowColor: '#7341FF',
				shapeSdfUrl: ـ.protonSDF
			}
		},
		position: { x: 11, y: 2 }
	},
	quake: {
		label: { icon: 'Quake', window: 'LibreQuake' },
		component: iframe({
			appID: 'quake',
			iframeOptions: { src: '/quake' }
		}),
		icon: ـ.quake,
		position: { x: 5, y: 5, width: 800, height: 600 }
	},
	quake2: {
		label: { icon: 'Quake II', window: 'Quake II Demo' },
		component: iframe({
			appID: 'quake2',
			iframeOptions: { src: '/quake2' }
		}),
		icon: ـ.quake2,
		position: { x: 6, y: 5, width: 1024, height: 576 }
	},
	quake3: {
		label: { icon: 'Quake III', window: 'Quake III Arena Demo' },
		component: iframe({
			appID: 'quake3',
			iframeOptions: { src: 'https://quake3.bergbok.party/?demo' }
		}),
		icon: ـ.quake3,
		position: { x: 7, y: 5, width: 1024, height: 576 }
	},
	readme: {
		label: 'README',
		component: defineAsyncComponent(async () => import('@compunents/apps/README.vue')),
		icon: ـ.picmin,
		position: { x: 10, y: 8, width: 756, height: 310, resizable: false }
	},
	realm: {
		label: 'Realm',
		component: defineAsyncComponent(async () => import('@compunents/apps/Realm.vue')),
		icon: ـ.realm,
		position: { x: 3, y: 0, width: 1024, height: 576 }
	},
	rss: {
		label: 'RSS',
		link: '/rss',
		icon: {
			icon: ـ.rss,
			shaderOptions: {
				glowColor: '#FC8900',
				shapeSdfUrl: ـ.rssSDF
			}
		},
		position: { x: 10, y: 7 }
	},
	settings: {
		label: 'Settings',
		component: defineAsyncComponent(async () => import('@compunents/apps/Settings.vue')),
		icon: ـ.settings,
		position: { x: 11, y: 8, width: 380, height: 520 }
	},
	scribble: {
		label: { icon: 'scribble', window: 'scribble.rs' },
		component: iframe({
			appID: 'scribble',
			iframeOptions: { src: 'https://scribble.bergbok.computer' }
		}),
		icon: ـ.scribble,
		position: { x: 1, y: 6, width: 960, height: 720 },
		persistent: true
	},
	sgidemos: {
		label: { icon: 'SGI Demos', window: 'Silicon Graphics, Inc. Demos' },
		component: defineAsyncComponent(async () => import('@compunents/apps/SiliconGraphicsDemos.vue')),
		icon: ـ.sgi,
		position: { x: 3, y: 6, width: 800, height: 480 }
	},
	silk: {
		label: { icon: 'Silk', window: 'Silk - Interactive Generative Art' },
		component: iframe({
			appID: 'silk',
			iframeOptions: { src: '/silk' }
		}),
		icon: ـ.silk,
		position: { x: 2, y: 0, width: 1024, height: 576 }
	},
	skullknight: {
		label: 'SkullKnight',
		link: 'https://www.skullknight.net/forum/index.php?members/bergbok.41750',
		icon: {
			icon: ـ.skullknight,
			shaderOptions: {
				glowColor: '#2A69AE',
				shapeSdfUrl: ـ.skullknightSDF
			}
		},
		position: { x: 11, y: 5 }
	},
	slender: {
		label: 'Slender',
		component: iframe({
			appID: 'slender',
			iframeOptions: { src: 'https://slender.bergbok.party' }
		}),
		icon: ـ.slender,
		position: { x: 7, y: 3, width: 1024, height: 768 },
		persistent: true
	},
	soniccd: {
		label: 'Sonic CD',
		...accessApp('soniccd', { src: 'https://sonic-cd.bergbok.party' }),
		icon: ـ.sonicCD,
		position: { x: 7, y: 0, width: 1018, height: 576 }
	},
	spotify: {
		label: 'Spotify',
		link: 'spotify:user:tipiesefokop',
		icon: {
			icon: ـ.spotify,
			shaderOptions: {
				glowColor: '#1ED760',
				shapeSdfUrl: ـ.spotifySDF
			}
		},
		position: { x: 11, y: 3 }
	},
	steam: {
		label: 'Steam',
		link: 'steam://url/SteamIDPage/76561198136217981',
		icon: {
			icon: ـ.steam,
			shaderOptions: {
				glowColor: '#146798',
				shapeSdfUrl: ـ.steamSDF
			}
		},
		position: { x: 10, y: 0 }
	},
	subwaysurfers: {
		label: 'Subway Surfers',
		component: iframe({
			appID: 'subwaysurfers',
			iframeOptions: { src: 'https://subwaysurfers.bergbok.party' }
		}),
		icon: ـ.subwaysurfers,
		position: { x: 2, y: 3, width: 360, height: 640 }
	},
	supermario64: {
		label: 'Super Mario 64',
		...accessApp('supermario64', { src: 'https://sm64.bergbok.party' }),
		icon: ـ.sm64,
		position: { x: 8, y: 0, width: 1024, height: 576 }
	},
	supermonkeyball: {
		label: 'Super Monkey Ball',
		component: iframe({
			appID: 'supermonkeyball',
			iframeOptions: { src: 'https://monkeyball.bergbok.party' }
		}),
		icon: ـ.monkeyball,
		position: { x: 2, y: 2, width: 1024, height: 640 }
	},
	tally: {
		label: 'Tally',
		component: defineAsyncComponent(async () => import('@compunents/apps/Tally.vue')),
		position: { x: 8, y: 4 }
	},
	terraria: {
		label: { icon: 'Terraria', window: 'Terrarium' },
		component: iframe({
			appID: 'terraria',
			iframeOptions: { src: 'https://terrarium.bergbok.party' }
		}),
		icon: ـ.terraria,
		position: { x: 3, y: 1, width: 1024, height: 576 }
	},
	thepowdertoy: {
		label: 'The Powder Toy',
		component: defineAsyncComponent(async () => import('@compunents/apps/ThePowderToy.vue')),
		icon: ـ.thepowdertoy,
		position: { x: 8, y: 7, width: 960, height: 720 },
		persistent: true
	},
	twitch: {
		label: 'Twitch',
		component: defineAsyncComponent(async () => import('@compunents/apps/Twitch.vue')),
		icon: ـ.twitch,
		position: { x: 10, y: 1, width: 640, height: 360 }
	},
	ULTRAKILL: {
		label: { icon: 'ULTRAKILL Prelude', window: 'MANKIND IS DEAD. BLOOD IS FUEL. HELL IS FULL.' },
		component: iframe({
			appID: 'ULTRAKILL',
			iframeOptions: { src: 'https://ultrakill.bergbok.party' }
		}),
		icon: ـ.ultrakill,
		position: { x: 8, y: 5, width: 1024, height: 576 }
	},
	untrusted: {
		label: { icon: 'Untrusted', window: 'Untrusted - or - The Continuing Adventures of Dr. Eval' },
		component: iframe({
			appID: 'untrusted',
			iframeOptions: { src: '/untrusted' }
		}),
		icon: ـ.untrusted,
		position: { x: 6, y: 0, width: 1024, height: 576 }
	},
	webamp: {
		label: 'Winamp',
		component: defineAsyncComponent(async () => import('@compunents/apps/Music.vue')),
		icon: ـ.winamp,
		position: { x: 4, y: 7 },
		chrome: 'none'
	},
	wikipedia: {
		label: 'Wikipedia',
		link: 'https://en.wikipedia.org/wiki/Special:Contributions/Bergbok',
		icon: {
			icon: ـ.wikipedia,
			shaderOptions: {
				glowColor: '#ADADAD',
				shapeSdfUrl: ـ.wikipediaSDF
			}
		},
		position: { x: 10, y: 6 }
	},
	windowsxp: {
		label: 'Windows XP',
		component: v86({
			appID: 'windowsxp',
			loadingImage: ـ.windowsxpLoading,
			lockPointer: true,
			v86Options: {
				hda: {
					url: '/v86/windowsxp/hdd.img',
					size: 17_179_869_184,
					async: true
				},
				initial_state: { url: '/r2/windowsxp.bin.zst' },
				memory_size: 2 * 1024 * 1024 * 1024,
				vga_memory_size: 32 * 1024 * 1024,
				acpi: false,
				cpuid_level: 2
			}
		}),
		icon: ـ.windowsxp,
		position: { x: 5, y: 7, width: 1024, height: 576 }
	},
	windows7: {
		label: 'Windows 7',
		component: v86({
			appID: 'windows7',
			loadingImage: ـ.windows7Loading,
			lockPointer: true,
			v86Options: {
				hda: {
					url: '/v86/windows7/hdd.img',
					size: 3_865_051_136,
					async: true
				},
				initial_state: { url: '/r2/windows7.bin.zst' },
				memory_size: 256 * 1024 * 1024,
				vga_memory_size: 32 * 1024 * 1024,
				acpi: true
			}
		}),
		icon: ـ.windows7,
		position: { x: 7, y: 7, width: 1024, height: 768 }
	},
	windows93: {
		label: 'Windows 93',
		component: iframe({
			appID: 'windows93',
			iframeOptions: { src: 'https://windows93.bergbok.computer' }
		}),
		icon: ـ.windows93,
		position: { x: 1, y: 7, width: 1024, height: 576, maximized: true }
	},
	windows98: {
		label: 'Windows 98',
		component: v86({
			appID: 'windows98',
			loadingImage: ـ.windows98Loading,
			lockPointer: true,
			v86Options: {
				hda: {
					url: '/v86/windows98/.img',
					size: 300 * 1024 * 1024,
					async: true,
					fixed_chunk_size: 256 * 1024,
					use_parts: true
				},
				initial_state: { url: ـ.windows98State },
				memory_size: 128 * 1024 * 1024,
				vga_memory_size: 8 * 1024 * 1024
			}
		}),
		icon: ـ.windows98,
		position: { x: 3, y: 7, width: 640, height: 480 }
	},
	wipeout: {
		label: 'WipEout',
		component: iframe({
			appID: 'wipeout',
			iframeOptions: { src: '/wipEout/game.html' }
		}),
		icon: ـ.wipeout,
		position: { x: 5, y: 3, width: 1024, height: 622 }
	},
	yugioh: {
		label: 'Yu-Gi-Oh!',
		component: defineAsyncComponent(async () => import('@compunents/apps/YuGiOh.vue')),
		icon: ـ.yugioh,
		position: { x: 4, y: 1, width: 400, height: 400 },
		persistent: true
	},
	yumenikki: {
		label: 'Yume Nikki',
		component: iframe({
			appID: 'yumenikki',
			iframeOptions: { src: 'https://yumenikki.bergbok.party' }
		}),
		icon: ـ.yumenikki,
		position: { x: 4, y: 3, width: 800, height: 600 },
		persistent: true
	}
} satisfies Record<string, AppEntry>);

function accessApp(appID: string, opts: IFrameAppOptions['iframeOptions']): Pick<AppEntry, 'component' | 'link'> {
	const src = opts.src!;
	return access ? { component: iframe({ appID, iframeOptions: opts }) } : { link: src };
}

function iframe(opts: IFrameAppOptions): Component {
	return defineAsyncComponent(async () => {
		const { default: IFrameWindow } = await import('@compunents/IFrameWindow.vue');
		return {
			name: `IFrameApp:${opts.appID}`,
			render: () => h(IFrameWindow as Component, { ...opts } as Record<string, unknown>)
		};
	});
}

function ruffle(opts: RuffleAppOptions): Component {
	return defineAsyncComponent(async () => {
		const { default: RuffleWindow } = await import('@compunents/RuffleWindow.vue');
		return {
			name: `RuffleApp:${opts.appID}`,
			render: () => h(RuffleWindow as Component, { ...opts } as Record<string, unknown>)
		};
	});
}

function v86(opts: V86AppOptions): Component {
	return defineAsyncComponent(async () => {
		const { default: V86Window } = await import('@compunents/V86Window.vue');
		return {
			name: `V86App:${opts.appID}`,
			render: () => h(V86Window as Component, { ...opts } as Record<string, unknown>)
		};
	});
}

export type AppID = keyof typeof APPS;
export const APP_IDS = Object.keys(APPS) as AppID[];
export function getApp(id: AppID): AppEntry {
	return APPS[id] as AppEntry;
}

export function getLabel(entry: AppEntry, surface: 'icon' | 'window'): string {
	return typeof entry.label === 'string' ? entry.label : entry.label[surface];
}

export function getIcon(entry: AppEntry): string | undefined {
	return typeof entry.icon === 'string' ? entry.icon : entry.icon?.icon;
}

export function getIconShader(entry: AppEntry): NeonShaderOptions | undefined {
	return typeof entry.icon === 'object' ? entry.icon.shaderOptions : undefined;
}
