export { default as Inset } from './Inset.vue';
export { default as Button } from './Button.vue';
export { default as Window } from './Window.vue';
export { default as MenuBar } from './MenuBar.vue';
export { default as Scrollbar } from './Scrollbar.vue';
export { MENU_DIVIDER } from 'os-gui/MenuBar.js';

export function checkItem(label: string, get: () => boolean, toggle: () => void): OSGUIMenuItem {
	return {
		label,
		checkbox: { check: get, toggle }
	};
}

export function radioGroup(
	items: readonly { label: string; value: string }[],
	get: () => string,
	set: (v: string) => void,
	ariaLabel: string
): OSGUIRadioGroup {
	return {
		ariaLabel,
		radioItems: items.map((item) => ({
			label: item.label,
			value: item.value
		})),
		getValue: get,
		setValue: set
	};
}
