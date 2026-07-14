<script setup lang="ts">
import IFrameWindow from '@compunents/IFrameWindow.vue';
import { get } from '@vueuse/core';
import { computed, ref } from 'vue';
import { checkItem, MENU_DIVIDER, MenuBar, radioGroup } from '@os-gui';

const version = ref('');
const effect = ref('');
const font = ref('matrixcode');
const showIntro = ref(false);
const glyphFlip = ref(false);

const src = computed(() => {
	const params = new URLSearchParams();
	if (get(version)) {
		params.set('version', get(version));
	}
	if (get(effect)) {
		params.set('effect', get(effect));
	}
	if (get(font) !== 'matrixcode') {
		params.set('font', get(font));
	}
	if (get(showIntro)) {
		params.set('skipIntro', 'false');
	}
	if (get(glyphFlip)) {
		params.set('glyphFlip', 'true');
	}
	return `/matrix/${params.size ? `?${params.toString()}` : ''}`;
});

const versions = [
	{ label: '&Classic', value: '' },
	{ label: '&3D', value: '3d' },
	{ label: '&Resurrections', value: 'resurrections' },
	{ label: '&Trinity', value: 'trinity' },
	{ label: '&Operator', value: 'operator' },
	{ label: '&Megacity', value: 'megacity' },
	{ label: '&Nightmare', value: 'nightmare' },
	{ label: '&Paradise', value: 'paradise' },
	{ label: 'Palimp&sest', value: 'palimpsest' },
	{ label: 'T&wilight', value: 'twilight' },
	{ label: 'Mor&pheus', value: 'morpheus' },
	{ label: '&Bugs', value: 'bugs' }
] as const satisfies readonly { label: string; value: string }[];

const effects = [
	{ label: '&Default (Palette)', value: '' },
	{ label: '&Plain', value: 'plain' },
	{ label: 'P&ride', value: 'pride' },
	{ label: '&Stripes', value: 'stripes' },
	{ label: '&Mirror', value: 'mirror' },
	{ label: 'Debug (&None)', value: 'none' }
] as const satisfies readonly { label: string; value: string }[];

const fonts = [
	{ label: '&Matrix Code', value: 'matrixcode' },
	{ label: '&Resurrections', value: 'resurrections' },
	{ label: '&Gothic', value: 'gothic' },
	{ label: '&Coptic', value: 'coptic' },
	{ label: 'Huberfish &A', value: 'huberfishA' },
	{ label: 'Huberfish &D', value: 'huberfishD' }
] as const satisfies readonly { label: string; value: string }[];

const menus: OSGUITopLevelMenus = {
	'&View': [
		checkItem(
			'Show &Intro',
			() => get(showIntro),
			() => {
				showIntro.value = !get(showIntro);
			}
		),
		checkItem(
			'Flip &Glyphs',
			() => get(glyphFlip),
			() => {
				glyphFlip.value = !get(glyphFlip);
			}
		),
		MENU_DIVIDER,
		{
			label: '&Version',
			submenu: [
				radioGroup(
					versions,
					() => get(version),
					(v) => {
						version.value = v;
					},
					'Matrix Version'
				)
			]
		},
		{
			label: '&Effect',
			submenu: [
				radioGroup(
					effects,
					() => get(effect),
					(v) => {
						effect.value = v;
					},
					'Visual Effect'
				)
			]
		},
		{
			label: '&Font',
			submenu: [
				radioGroup(
					fonts,
					() => get(font),
					(v) => {
						font.value = v;
					},
					'Font'
				)
			]
		}
	]
};
</script>

<template>
	<IFrameWindow ref="frameWindow" app-i-d="matrix" :iframe-options="{ src }">
		<template #menubar>
			<MenuBar :menus="menus" />
		</template>
	</IFrameWindow>
</template>
