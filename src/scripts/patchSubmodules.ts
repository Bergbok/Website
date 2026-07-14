import { resolve } from 'path';
import { globSync } from 'glob';
import { isComment } from 'domhandler';
import { parse, serialize } from 'parse5';
import { readFileSync, writeFileSync } from 'fs';
import { adapter } from 'parse5-htmlparser2-tree-adapter';
import { filter, findOne, removeElement } from 'domutils';
import type { Plugin } from 'vite';

const ᱻ = resolve(import.meta.dirname, '../lib');

const animalCrossingHTML = resolve(ᱻ, 'animalcrossing/pc/build-web/web/index.html');
const diabloJS = globSync('main-*.js', { absolute: true, cwd: resolve(ᱻ, 'diablo/build/assets') })[0]!;
const doomHTML = resolve(ᱻ, 'doom/build/index.html');
const jspaintHTML = resolve(ᱻ, 'jspaint/index.html');
const jspaintMenuJS = resolve(ᱻ, 'jspaint/src/menus.js');
const pipesHTML = resolve(ᱻ, 'pipes/index.html');
const quake2HTML = resolve(ᱻ, 'quake2/release/index.html');
const sgiButtonflyHTML = resolve(ᱻ, 'sgi-demos/demos/buttonfly/web/buttonfly_full.html');
const audiOrbitsJS = resolve(ᱻ, 'audiorbits/js/audiOrbits.js');
const audiOrbitsJSON = resolve(ᱻ, 'audiorbits/project.json');
const weicueJS = resolve(ᱻ, 'audiorbits/we_utils/weicue.js');
const wewwaJS = resolve(ᱻ, 'audiorbits/we_utils/wewwa.js');

function patchAnimalCrossing(content: string): string {
	const document = parse(content, { treeAdapter: adapter });
	const fluff = findOne((el) => el.attribs.id === 'rom-instructions', document, true);

	if (fluff) {
		removeElement(fluff);
	}

	return serialize(document, { treeAdapter: adapter }).replace(/^\s*\n/gm, '');
}

function patchDiablo(content: string): string {
	return content
		.replace(
			'N.jsxs("p",{className:"startMeta",children:["Web port based on reconstructed source (",N.jsx(Mu,{href:"https://github.com/awest813/OpenTristam",children:"project on GitHub"}),"). Not affiliated with Blizzard."]})',
			''
		)
		.replace('children:"Fastest try"', 'children:"Fastest"');
}

function patchDoom(content: string): string {
	const css = [
		'html, body { width: 100%; height: 100%; overflow: hidden; margin: 0; padding: 0 }',
		'canvas.emscripten{ width: 100% !important; height: 100% !important; object-fit: contain !important }'
	].join('');

	return content.replace('</head>', `<style>${css}</style></head>`);
}

function patchJSPaint(filepath: string, content: string): string {
	if (filepath.endsWith('menus.js')) {
		return content.replace(
			/\s*MENU_DIVIDER,\s*\{[^{}]*label:[\s\w(:)"]*Project News(?:[^{}]|\{[^{}]*\})*\},?/s,
			''
		);
	}

	const document = parse(content, { treeAdapter: adapter });
	const news = findOne((el) => el.attribs.id === 'news', document, true);
	const noscript = findOne((el) => el.tagName === 'noscript', document, true);
	const updateBanner = findOne((el) => el.attribs.id === 'jspaint-update-status-area', document, true);
	const metaCSP = findOne(
		(el) => el.tagName === 'meta' && el.attribs['http-equiv'] === 'Content-Security-Policy',
		document,
		true
	);
	const newsJS = findOne((el) => el.tagName === 'script' && el.attribs.src === 'src/test-news.js', document, true);
	const sessionsJS = findOne((el) => el.tagName === 'script' && el.attribs.src === 'src/sessions.js', document, true);

	for (const el of [metaCSP, news, newsJS, noscript, sessionsJS, updateBanner, ...filter(isComment, document)]) {
		if (el) {
			removeElement(el);
		}
	}

	return serialize(document, { treeAdapter: adapter }).replace(/^\s*\n/gm, '');
}

function patchPipes(content: string): string {
	const document = parse(content, { treeAdapter: adapter });
	const githubLink = findOne(
		(el) =>
			el.tagName === 'a' &&
			el.attribs.href === 'https://github.com/1j01/pipes' &&
			el.attribs.class === 'ui-container',
		document,
		true
	);
	if (githubLink) {
		removeElement(githubLink);
	}

	for (const comment of filter(isComment, document)) {
		removeElement(comment);
	}

	return serialize(document, { treeAdapter: adapter }).replace(/^\s*\n/gm, '');
}

function patchAudiOrbits(filepath: string, content: string): string {
	if (filepath.endsWith('audiOrbits.js')) {
		return content.replace(
			'popupMessage: function (msg, hideAfter) {\n        const txtElm = $("#txtholder");\n        txtElm.html(msg);\n        txtElm.fadeIn({queue: false, duration: "slow"});\n        txtElm.animate({bottom: "40px"}, "slow");\n        if (hideAfter) setTimeout(() => {\n            txtElm.fadeOut({queue: false, duration: "slow"});\n            txtElm.animate({bottom: "-40px"}, "slow");\n        }, 7000);\n    }',
			'popupMessage: function () {}'
		);
	}
	if (filepath.endsWith('project.json')) {
		const json = JSON.parse(content);
		json.general.properties.seizure_warning.value = false;
		json.general.properties.icue_mode.value = 0;
		json.general.properties.parallax_option.value = 1;
		json.general.properties.parallax_strength.value = 6.9;
		json.general.properties.default_brightness.value = 69;
		json.general.properties.zoom_val.value = 4.2;
		json.general.properties.bloom_filter.value = true;
		json.general.localization['en-us'].ui_default_brightness = 'Brightness';
		json.general.localization['en-us'].ui_default_saturation = 'Saturation';
		json.general.localization['en-us'].ui_browse_properties_scheme_color = '<u><h4>Scheme Color</h4></u>';
		return JSON.stringify(json);
	}
	if (filepath.endsWith('wewwa.js')) {
		return content
			.replace(
				'var wewwApp = wewwApp || {};\n\nwewwApp.Init',
				'var wewwApp = wewwApp || {}; let _wewwaTimer; wewwApp.Init'
			)
			.replace(
				'.wewwaIcon {\n        right:0px;\n        cursor:pointer;\n    }',
				'.wewwaIcon { right: 0px; cursor: pointer; opacity: 0; transition: opacity 500ms ease; }'
			)
			.replace(
				'        }\n    }\n    `;\n    document.head.append(st);',
				'}} .wewwaMenu > img, .wewwaMenu > a, #wewwa_HEADER_ICUE, #wewwa_HEADER_IMGS, #wewwa_HEADER_MISC, #wewwa_HEADER_THANKS, tr:has(td h2) + tr:has(td[colspan="2"]) { display: none !important }`; document.head.append(st);'
			)
			.replace(
				String.raw`footer.innerHTML = "<br><hr><h3 style='width:130px;text-align:left;display:block;margin:0 auto;'>[W] allpaper<br>[E] ngine<br>[W] eb<br>[W] allpaper<br>[A] dapter<a target=\"_blank\" href='https://hexx.one'>hexxone</a>"`,
				String.raw`footer.innerHTML = "<br><hr><h3 style='width:130px;display:block;margin:0 auto;'><a target=\"_blank\" href='https://github.com/hexxone/audiorbits'>GitHub</a>"`
			)
			.replace(
				'document.body.append(menu, icon);\n    wewwApp.html',
				"document.body.append(menu, icon); $(document).on('mousemove', () => {$('.wewwaIcon').css('opacity', 1); clearTimeout(_wewwaTimer); _wewwaTimer = setTimeout(() => $('.wewwaIcon').css('opacity', 0), 2000);}); wewwApp.html"
			);
	}
	return content;
}

const patchQuake2 = patchDoom;

function patchSGIButtonfly(content: string): string {
	const stripped = content.replace(/\n[ \t]*<div[^>]*>[\s\S]*?https:\/\/github\.com\/sgi-demos\/[\s\S]*?<\/div>/, '');

	const interceptScript = [
		'<script type="text/javascript">',
		'	const _sgiBFEval = globalThis.eval.bind(globalThis);',
		'	globalThis.eval = function (c) {',
		"		if (typeof c === 'string')",
		"			c = c.replace('https://sgi-demos.github.io/sgi-demos/demos/', '/sgi-demos/');",
		'		return _sgiBFEval(c);',
		'	};',
		'</script>'
	].join('\n');

	return stripped.replace(/<script[^>]+src="\.\/buttonfly\.js"[^>]*><\/script>/, `${interceptScript}$&`);
}

export default function patchSubmodules(): Plugin {
	return {
		name: 'patch-submodules',
		configureServer(server): void {
			server.middlewares.use((req, res, next) => {
				const [url] = (req.url ?? '').split('?');

				res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
				res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');

				if (url === '/animalcrossing/' || url === '/animalcrossing/index.html') {
					res.setHeader('Content-Type', 'text/html');
					res.end(patchAnimalCrossing(readFileSync(animalCrossingHTML, 'utf8')));
					return;
				}
				if (url && /\/diablo\/build\/assets\/main-.*\.js/gm.test(url)) {
					res.setHeader('Content-Type', 'application/javascript');
					res.end(patchDiablo(readFileSync(diabloJS, 'utf8')));
					return;
				}
				if (url === '/doom/' || url === '/doom/index.html') {
					res.setHeader('Content-Type', 'text/html');
					res.end(patchDoom(readFileSync(doomHTML, 'utf8')));
					return;
				}
				if (url === '/jspaint/' || url === '/jspaint/index.html') {
					res.setHeader('Content-Type', 'text/html');
					res.end(patchJSPaint(jspaintHTML, readFileSync(jspaintHTML, 'utf8')));
					return;
				}
				if (url === '/jspaint/src/menus.js') {
					res.setHeader('Content-Type', 'application/javascript');
					res.end(patchJSPaint(jspaintMenuJS, readFileSync(jspaintMenuJS, 'utf8')));
					return;
				}
				if (url === '/pipes/' || url === '/pipes/index.html') {
					res.setHeader('Content-Type', 'text/html');
					res.end(patchPipes(readFileSync(pipesHTML, 'utf8')));
					return;
				}
				if (url === '/quake2/' || url === '/quake2/index.html') {
					res.setHeader('Content-Type', 'text/html');
					res.end(patchDoom(readFileSync(quake2HTML, 'utf8')));
					return;
				}
				if (url === '/sgi-demos/buttonfly/web/buttonfly_full.html') {
					res.setHeader('Content-Type', 'text/html');
					res.end(patchSGIButtonfly(readFileSync(sgiButtonflyHTML, 'utf8')));
					return;
				}
				if (url === '/audiorbits/project.json') {
					res.setHeader('Content-Type', 'application/json');
					res.end(patchAudiOrbits(audiOrbitsJSON, readFileSync(audiOrbitsJSON, 'utf8')));
					return;
				}
				if (url === '/audiorbits/js/audiOrbits.js') {
					res.setHeader('Content-Type', 'application/javascript');
					res.end(patchAudiOrbits(audiOrbitsJS, readFileSync(audiOrbitsJS, 'utf8')));
					return;
				}
				if (url === '/audiorbits/we_utils/weicue.js') {
					res.setHeader('Content-Type', 'application/javascript');
					res.end(patchAudiOrbits(weicueJS, readFileSync(weicueJS, 'utf8')));
					return;
				}
				if (url === '/audiorbits/we_utils/wewwa.js') {
					res.setHeader('Content-Type', 'application/javascript');
					res.end(patchAudiOrbits(wewwaJS, readFileSync(wewwaJS, 'utf8')));
					return;
				}
				next();
			});
		},
		closeBundle(): void {
			if (this.environment?.name !== 'client') {
				return;
			}

			writeFileSync(animalCrossingHTML, patchAnimalCrossing(readFileSync(animalCrossingHTML, 'utf8')));
			writeFileSync(diabloJS, patchDiablo(readFileSync(diabloJS, 'utf8')));
			writeFileSync(doomHTML, patchDoom(readFileSync(doomHTML, 'utf8')));
			writeFileSync(jspaintHTML, patchJSPaint(jspaintHTML, readFileSync(jspaintHTML, 'utf8')));
			writeFileSync(jspaintMenuJS, patchJSPaint(jspaintMenuJS, readFileSync(jspaintMenuJS, 'utf8')));
			writeFileSync(pipesHTML, patchPipes(readFileSync(pipesHTML, 'utf8')));
			writeFileSync(quake2HTML, patchQuake2(readFileSync(quake2HTML, 'utf8')));
			writeFileSync(sgiButtonflyHTML, patchSGIButtonfly(readFileSync(sgiButtonflyHTML, 'utf8')));
			writeFileSync(audiOrbitsJS, patchAudiOrbits(audiOrbitsJS, readFileSync(audiOrbitsJS, 'utf8')));
			writeFileSync(audiOrbitsJSON, patchAudiOrbits(audiOrbitsJSON, readFileSync(audiOrbitsJSON, 'utf8')));
			writeFileSync(weicueJS, patchAudiOrbits(weicueJS, readFileSync(weicueJS, 'utf8')));
			writeFileSync(wewwaJS, patchAudiOrbits(wewwaJS, readFileSync(wewwaJS, 'utf8')));
		}
	};
}
