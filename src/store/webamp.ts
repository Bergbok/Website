import Nightjuice from '@assets/audio/nightjuice.opus?url';
import CharliesHere from '@assets/audio/charlies-here.opus?url';
import ParisStGermain from '@assets/audio/paris-st-germain.opus?url';
import TheElevatorBossaNova from '@assets/audio/the-elevator-bossa-nova.opus?url';
import { ref } from 'vue';
import { defineStore } from 'pinia';
import type Webamp from 'webamp/butterchurn';
import type { ButterchurnPresetJson, URLTrack } from 'webamp';

const WEBAMP_WINDOWS = ['main', 'milkdrop'] as const;

export const useWebampStore = defineStore('webamp', () => {
	const instance = ref<Webamp | null>(null);
	let stopMinimizeHook: (() => void) | null = null;
	let stopCloseHook: (() => void) | null = null;
	const isOpen = ref(false);
	const isMinimized = ref(false);

	function setInstance(w: Webamp | null): void {
		stopMinimizeHook?.();
		stopMinimizeHook = null;
		stopCloseHook?.();
		stopCloseHook = null;

		if (!w) {
			instance.value = null;
			isOpen.value = false;
			isMinimized.value = false;
			return;
		}

		instance.value = w;
		stopMinimizeHook = w.onMinimize(() => {
			const gen = w.store.getState().windows.genWindows;
			for (const id of WEBAMP_WINDOWS) {
				if (gen[id]?.open) {
					w.store.dispatch({ type: 'TOGGLE_WINDOW', windowId: id });
				}
			}
			isMinimized.value = true;
		});
		stopCloseHook = w.onClose(() => {
			isOpen.value = false;
		});
	}

	function open(): void {
		const w = instance.value;
		if (!w) {
			return;
		}
		if (w.store.getState().display?.closed) {
			w.reopen();
		}
		const gen = w.store.getState().windows.genWindows;
		for (const id of WEBAMP_WINDOWS) {
			if (!gen[id]?.open) {
				w.store.dispatch({ type: 'TOGGLE_WINDOW', windowId: id });
			}
		}
		isOpen.value = true;
		isMinimized.value = false;
	}

	function toggle(): void {
		const w = instance.value;
		if (!w) {
			return;
		}
		const gen = w.store.getState().windows.genWindows;
		const anyOpen = WEBAMP_WINDOWS.some((id) => gen[id]?.open);
		if (anyOpen) {
			for (const id of WEBAMP_WINDOWS) {
				if (gen[id]?.open) {
					w.store.dispatch({ type: 'TOGGLE_WINDOW', windowId: id });
				}
			}
			isMinimized.value = true;
		} else {
			open();
		}
	}

	function playTracks(tracks: URLTrack[]): void {
		const w = instance.value;
		if (!w) {
			return;
		}
		w.setTracksToPlay(tracks);
		open();
	}

	return { instance, isOpen, isMinimized, setInstance, open, toggle, playTracks };
});

const defaultTracks = [
	{
		metaData: { artist: 'Skip Peck', title: "Charlie's Here" },
		url: CharliesHere,
		duration: 167
	},
	{
		metaData: { artist: 'Jeremy Sherman', title: 'Paris St. Germain' },
		url: ParisStGermain,
		duration: 95
	},
	{
		metaData: { artist: 'Benjamin Tissot', title: 'The Elevator Bossa Nova' },
		url: TheElevatorBossaNova,
		duration: 254
	},
	{
		metaData: { artist: 'Dynamedion GbR', title: 'Nightjuice' },
		url: Nightjuice,
		duration: 140
	}
] as URLTrack[];

const devTracks = import.meta.env.DEV && (await import('@scripts/importWebampDevTracks.ts')).execute();

export const initialTracks = devTracks && devTracks.length > 0 ? devTracks : defaultTracks;

export const availableSkins = Object.entries(
	import.meta.glob<string>('@assets/winamp/*.wsz', {
		eager: true,
		import: 'default',
		query: '?url'
	})
).map(([path, url]) => ({
	url,
	name: path.split('/').pop()!.replace('.wsz', '')
}));

function getStoredSkin(): (typeof availableSkins)[number] {
	const storedName = localStorage.getItem('webamp:skin');
	if (storedName) {
		const found = availableSkins.find((s) => s.name === storedName);
		if (found) {
			return found;
		}
	}
	return availableSkins.find((s) => s.name === 'Simple')!;
}

export const initialSkin = { url: getStoredSkin().url };

let skinPersistenceAttached = false;
export function attachSkinPersistence(): () => void {
	if (skinPersistenceAttached) {
		return () => {};
	}
	skinPersistenceAttached = true;

	const skinByUrl = new Map(availableSkins.map((s) => [s.url, s.name]));
	const origFetch = window.fetch;

	const patched = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		let url: string | null = null;
		if (typeof input === 'string') {
			url = input;
		} else if (input instanceof URL) {
			url = input.href;
		} else {
			({ url } = input);
		}
		if (url && skinByUrl.has(url)) {
			localStorage.setItem('webamp:skin', skinByUrl.get(url)!);
		}
		return origFetch(input, init);
	};

	window.fetch = Object.assign(patched, window.fetch) as typeof window.fetch;

	return () => {
		window.fetch = origFetch;
		skinPersistenceAttached = false;
	};
}

const butterchurnPresets = Object.entries(
	import.meta.glob<object>(
		[
			'./*.json',
			'!./*#*.json',
			'!./_Aderrasi - Wanderer in Curved Space - mash0000 - faclempt kibitzing meshuggana schmaltz (Geiss color mix).json',
			'!./_Geiss - Artifact 01.json',
			'!./_Geiss - Brain Zoom 3 (Color Emboss Mix).json',
			'!./_Geiss - untitled.json',
			'!./_Krash + Eo.S. - Photographic Sentinel.json',
			'!./_Mig_009.json',
			'!./_Mig_039.json',
			'!./_Rovastar + Geiss - Hurricane Nightmare (Posterize Mix).json',
			'!./_Vovan + Geiss - Bass With Flover (Feedback Mix) 2.json',
			'!./*mindblob*.json',
			'!./$$$ Royal - Mashup (160).json',
			'!./$$$ Royal - Mashup (253).json',
			'!./adam eatit fx 2 martin - disco mix, lodus, geiss, ludicrous speed,flexi, aderrasi n hexcollie.json',
			'!./Adam Eatit Mashup FX 2 martin - disco mix + Lodus + Geiss + Ludicrous speed + Eos Ft Flexi n Hexocollie + Baked + Santa Fucking Claus.json',
			'!./Adam Fx 2 Zylot*.json',
			'!./Aderrasi - Agitator.json',
			'!./Aderrasi - Halls Of Centrifuge.json',
			'!./Aderrasi - Mother Of Pearl - mash0000 - how to piss off your eyes.json',
			'!./Aderrasi - Storm of the Eye (Thunder) - mash0000 - quasi pseudo meta concentrics.json',
			'!./amandio c - flashy thing.json',
			'!./amandio c - fume.json',
			'!./baked - Chinese Fingerbang (cao ni ma =]) - PieturP colors - Bitcore speed tweak.json',
			'!./baked - mushroom rainbows[acid Storm].json',
			'!./beta106i - Burning Form (Seething Mass) - mash0000 - fire paint easter egg internals.json',
			'!./beta106i - Inhuman Emotion (Regret) - mash0000 - genetic mutant incubators in the hands of toddlers.json',
			'!./Cope - Keanu Reeves Is A Bad Actor.json',
			'!./cope - matrixcode7.json',
			'!./cope - soar (v2.0).json',
			'!./DemonLD_-_Toxic_water_diffusion threx angela vs debi brown (nice).json',
			'!./ech0 - liquid firesticks I.json',
			'!./Eo.S. - glowsticks v2 05 and proton lights (+Krash′s beat code) _Phat_remix02b.json',
			'!./Eo.S. - glowsticks v2 05 and proton lights (+Krash′s beat code) _Phat_remix03 madhatter_v2.json',
			'!./Eo.S. + flexi - glowsticks v2 05 and proton lights (+Krash′s beat code) _Phat_remix02b + illumination (Stahl′s Mix).json',
			'!./Eo.S. + Geiss - glowsticks v2 02 (Relief Mix).json',
			'!./Eo.S. + Phat cubetrace (cybercity madness remix) - mash0000 - evaporating crystal pharma.json',
			'!./ethical rotterdamasm.json',
			'!./fed - glowing 5 - fingers rmx nz+ round squarishness.json',
			'!./fed + flexi - tech test 2-1 - humpgorge.json',
			'!./fiShbRaiN - a quiet death.json',
			'!./fiShbRaiN - toffee cream and icing sugar.json',
			'!./fishbrain + flexi - stitchcraft.json',
			'!./fiShbRaiN + flexi - witchcraft 2.0 - mash0000 - no one cares about mi, the note (major third).json',
			'!./fiShbRaiN + Flexi - witchcraft unleashed.json',
			'!./flexi - alien canvas [learning].json',
			'!./Flexi - alien fish pond.json',
			'!./Flexi - alien web bouncer [26].json',
			'!./Flexi - area 51.json',
			'!./Flexi - blame hexcollie twice.json',
			'!./flexi - borderline imagery.json',
			'!./flexi - can′t think of mosaic cages.json',
			'!./Flexi - dimensions, projection and abstraction.json',
			'!./flexi - infused with the spiral (jelly 4.x cn).json',
			'!./flexi - inter state.json',
			'!./flexi - meta4free.json',
			'!./Flexi - piercing.json',
			'!./Flexi - predator-prey-spirals [stahlregens gelatine finish].json',
			'!./Flexi - predator-prey-spirals.json',
			'!./Flexi - the distant point between derivative.json',
			'!./flexi - what is the matrix.json',
			'!./Flexi - wild at range.json',
			'!./flexi + amandio c - organic*.json',
			'!./flexi + cope - i blew you a soap bubble now what - feel the projection you are, connected to it all nz+ wrepwrimindloss w8.json',
			'!./Flexi + fiShbRaiN - operation fatcap II.json',
			'!./flexi + fishbrain - witchcraft*.json',
			'!./Flexi + Geiss - antagonizing beat detection codes.json',
			'!./Flexi + Martin - astral projection.json',
			'!./Flexi + Martin - dive.json',
			'!./Flexi, martin + geiss - dedicated to the sherwin maxawow.json',
			'!./Flexi, Martin, Phat, Zylot + Eo.S - one way trip trap proof of concept [epileptic zoom tunnel edit].json',
			'!./Fumbling_Foo & Flexi, Martin, Orb, Unchained - Star Nova v7b.json',
			'!./Geiss - Brain Zoom 4.json',
			'!./Geiss - Desert Rose 4.json',
			'!./Geiss - Drop Shadow 1.json',
			'!./Geiss - Drop Shadow 2.json',
			'!./Geiss - El Cubismo.json',
			'!./Geiss - Feedback 2.json',
			'!./Geiss - Flotsam - mash0000 - unfathomably advanced yet psychotic aliens churn my mental insides.json',
			'!./Geiss - Reaction Diffusion 2.json',
			'!./Geiss - Reaction Diffusion 3 (Lichen Mix).json',
			'!./Geiss - Reaction Diffusion 3.json',
			'!./Geiss - Skin Dots Multi-layer 3.json',
			'!./Geiss - Spiral Artifact.json',
			'!./Geiss - Thumb Drum.json',
			'!./Geiss + Flexi + Martin - disconnected.json',
			'!./Goody - Ego Decontructor.json',
			'!./goody + martin - crystal palace - schizotoxin - the wild iris bloom - 16 iterations.json',
			'!./GreatWho - Lasershow.json',
			'!./Hexcollie - Cell division.json',
			'!./Idiot - Star Of Annon.json',
			'!./Illusion & Rovastar - Dotty Mad Space (Jelly).json',
			'!./Ishan - Anuera.json',
			'!./Krash - War Machine (Shifting Complexity Mix).json',
			'!./Krash + Illusion - Spiral Movement.json',
			'!./Krash + Illusion + Geiss - Spiral Movement (Reaction Diffusion mix).json',
			'!./lit claw (explorers grid) - i don′t have either a belfry or bats bitch.json',
			'!./LuxXx - GrindFace  225 mg dose  .json',
			'!./Martin - acid wiring.json',
			'!./martin - adrift on a dead planet*.json',
			'!./martin - alien grand theft water.json',
			'!./martin - angel flight.json',
			'!./martin - basal ganglion.json',
			'!./Martin - bombyx mori mix2.json',
			'!./martin - bombyx mori.json',
			'!./martin - bombyx mori*.json',
			'!./martin - bring up the big guns.json',
			'!./martin - carpet weaver.json',
			'!./martin - castle in the air.json',
			'!./martin - chain breaker xxx.json',
			'!./martin - city of shadows.json',
			'!./Martin - cool morning.json',
			'!./martin - cope - laser dome.json',
			'!./martin - crystal palace.json',
			'!./martin - dark galaxy.json',
			'!./Martin - Diabolo.json',
			'!./Martin - disco mix 3 -fast.json',
			'!./martin - disco mix 4.json',
			'!./Martin - disco mix 6.json',
			'!./martin - dune racer.json',
			'!./martin - elusive impressions mix1.json',
			'!./martin - elusive impressions mix2 - flacc mess proph nz+2.json',
			'!./martin - extreme heat.json',
			'!./martin - Flexis swarm in Martins pond [not yet a boid implementation].json',
			'!./martin - frosty caves 2.json',
			'!./martin - fruit machine.json',
			'!./martin - gate to moria.json',
			'!./martin - ghost city.json',
			'!./martin - ice flames.json',
			'!./martin - into the fireworks.json',
			'!./Martin - liquid arrows.json',
			'!./martin - neon space ps2 (ati fix) - yaqui graph - flx food.json',
			'!./martin - organic light.json',
			'!./martin - rogue wave -ps*.json',
			'!./martin - satellite view.json',
			'!./martin - shifter - armorial bearings of robotopia.json',
			'!./martin - skywards.json',
			'!./martin - soma in pink.json',
			'!./martin - sparky caleidoscope.json',
			'!./martin - starfield sectors.json',
			'!./martin - sunset over the river.json',
			'!./martin - test.json',
			'!./martin - tunnel race.json',
			'!./martin - unholy amulet 2.json',
			'!./martin - witchcraft reloaded.json',
			'!./martin + stahlregen - martin in da mash 16.json',
			'!./martin + stahlregen - martin in da mash*.json',
			'!./martin, fishbrain + flexi - mandelbox explorer v1 Eo.S. optimize [bipolar witchcraft mix].json',
			'!./martin, flexi, fishbrain + sto - enterstate [random mashup].json',
			'!./MilkDrop2077.R002.json',
			'!./MilkDrop2077.R033.json',
			'!./MilkDrop2077.R037.json',
			'!./NeW Adam Master Mashup FX 2 Geiss - Reaction Diffusion 34 + Swelling Spiral  + Liquid Fire  + Geiss an46.json',
			'!./one-sided infinite-dimensional shape - helenisch.json',
			'!./orb - acid cycle [flexi shader mix] - yaqui graph.json',
			'!./ORB - Blue Emotion.json',
			'!./ORB - Depth Charge 2.json',
			'!./ORB - Fire and Fumes 2.json',
			'!./ORB - Magma Pool.json',
			'!./ORB - Pastel Primer.json',
			'!./ORB - Sandblade.json',
			'!./ORB - Solar Radiation.json',
			'!./ORB - Waaa.json',
			'!./phat + Eo.S. - Bass_responce_Red_Movements_Disorienting nebula3.json',
			'!./Phat+fiShbRaiN+Eo.S_Mandala_Chasers_remix.json',
			'!./PieturP - triptrap_(getting_concrete_visions_through_a_diafragma_version).json',
			'!./PieturP - triptrap_(ultimate-trip-mix).json',
			'!./raron - a grayish blob - mash0000 - pungent gastric automata cloud fumes.json',
			'!./rce-ordinary + flexi - far away distance (custom beat detection + bipolar colour ghost mix).json',
			'!./repressed americans - massive cheese lard nz+ redkneck treads.json',
			'!./Rocke - Answer.42 (New Mix 1) - mash0000 - slash and char p. jungle.json',
			'!./Rovastar - A Million Miles From Earth (Wormhole Mix).json',
			'!./Rovastar - Harlequin′s Fractal Encounter - cancer of saints.json',
			'!./Rovastar & Idiot24-7 - Balk Acid.json',
			'!./Rovastar & Loadus + Zylot - FractalDrop (Spark Machine v2.0).json',
			'!./Rovastar + Che - Asylum Animations.json',
			'!./Rovastar + Flexi - Hurricane Nightmare (Moebius Mix).json',
			'!./Rovastar + Fvese - Mosaic Waves.json',
			'!./Rovastar + Geiss - Hurricane Nightmare (Gold Chrome Mix).json',
			'!./Rovastar + Geiss - Hurricane Nightmare (Relief Mix).json',
			'!./Rovastar + Geiss - Hurricane Nightmare.json',
			'!./Rovastar + Geiss - Snapshot Of Space (LSB mix).json',
			'!./Rovastar + Telek - Altars of Madness (Rolling Oceans Mix).json',
			'!./Rovastar-altarsofmadness(forgottenrea.json',
			'!./sawtooth grin nz+ m10 w4.json',
			'!./ShadowHarlequin - LovelyShinySquares [ liquid starburst rmx ] - unchained + rovaster - luckless - martin - starfield sector.json',
			'!./shifter - dark tides bdrv mix.json',
			'!./shifter - escape (sigur ros).json',
			'!./shifter - escape the worm - Eo.S. + Phat - Before_It_Eats_Your_Brain_Mix_v2.json',
			'!./shifter - feathers (angel wings).json',
			'!./shifter - fire and brimstone.json',
			'!./shifter - fractal grinder.json',
			'!./shifter - fuzzball 3d (glasses) false auralary2 undre thee bottom qoaguluste.json',
			'!./shifter + flexi - american oblivion pie.json',
			'!./Stahlregen - Dots (Pixels - Blocky) (Jelly V2).json',
			'!./stahlregen - old school, baby (spiral ornament).json',
			'!./Stahlregen & Boz - Machine Code (Reaction Diffusion)_1 - Isosceles Tweak 08.json',
			'!./Stahlregen & Boz + Eo.S + Geiss + Phat + Rovastar + Zylot - Machine Code [Jelly].json',
			'!./Stahlregen & fishbrain + flexi + geiss - The Machine that conquered the Aether.json',
			'!./Stahlregen & flexi + Geiss + Rovastar + Shifter - Fractal Feedback (for Hexcollie).json',
			'!./stahlregen & geiss + rovastar - fields of flowers (mashup 9 - space flower rmx) - mash0001 - pack em in, we got a long haul + flashlight.json',
			'!./stahlregen + geiss + shifter - babylon.json',
			'!./Stahlregen + martin + others - Psychedelic Metal Flower.json',
			'!./Studio Music and Unchained - Rapid Alteration.json',
			'!./suksma - barium titanate.json',
			'!./suksma - coal drapes*.json',
			'!./suksma - ed geining hateops - squeakers.json',
			'!./suksma - gaeomaentaec - log smell 2 - steaming wienies2.json',
			'!./suksma - grainery clock mortis.json',
			'!./suksma - nip tuck.json',
			'!./suksma - water cooled red uranium vs dotes - freeenergynow.net.json',
			'!./suksma - youtube PQsWLhvuKk8 - waving goodbye to earth.json',
			'!./Telek - City Helix Lattice.json',
			'!./Telek - Sine Wave.json',
			'!./Unchained - All You Can Eat.json',
			'!./Unchained - Fuzzy Sciences.json',
			'!./Unchained - Making a Science of It 7.json',
			'!./Unchained - Rewop.json',
			'!./Unchained - Unified Drag 2.json',
			'!./Unchained & Rovastar - Wormhole Pillars (Hall of Shadows mix).json',
			'!./Waltra - Cosmic Wind.json',
			'!./xtramartin (849).json',
			'!./yin - 19* - Temporal*.json',
			'!./yin - 315 - Ocean of Light (yo im peakin yo Eo.S.-Phat).json',
			'!./yin - 393 - Artificial Inspiration (music driven - outward).json',
			'!./yin + Geiss - 240 - Electric universe (Bkg Mix).json',
			'!./Zylot - Age of Science (seeking truth mix).json',
			'!./Zylot - Heaven Bloom nz+.json',
			'!./Zylot - In death there is life (Geiss Layered Mix).json',
			'!./Zylot - Star Ornament.json',
			'!./Zylot - True Visionary*.json',
			"!./martin - the bridge of khazad-dum [flexi's growth raised to the power of transcendence mix].json",
			"!./suksma - ed geining hateops - flx i want you, i'm sick with you.json",
			"!./TonyMilkdrop - Leonardo Da Vinci's Balloon [Flexi - merry-go-round + techstyle].json",
			"!./TonyMilkdrop - Magellan's Nebula*.json"
		],
		{
			base: '/node_modules/butterchurn-presets/presets/converted',
			eager: true,
			import: 'default'
		}
	)
).map(([path, preset]) => ({
	name: path.split('/').pop()!.replace('.json', ''),
	butterchurnPresetObject: preset
})) as ButterchurnPresetJson[];

export async function requireButterchurnPresets(): Promise<ButterchurnPresetJson[]> {
	return Promise.resolve(butterchurnPresets);
}
