import type { Component } from 'vue';
import type { Neon } from 'shaders/vue';
import type { GridStackPosition } from 'gridstack';
import type V86Window from '@compunents/V86Window.vue';
import type IFrameWindow from '@compunents/IFrameWindow.vue';
import type RuffleWindow from '@compunents/RuffleWindow.vue';

export type AppChrome = 'window' | 'none';

export type AppLink = string;

export type AppIcon =
	| string
	| {
			icon: string;
			shaderOptions?: NeonShaderOptions;
	  };

export type NeonShaderOptions = InstanceType<typeof Neon>['$props'];

export type AppPosition = GridStackPosition & {
	width?: number;
	height?: number;
	initialX?: number;
	initialY?: number;
	minWidth?: number;
	minHeight?: number;
	maximized?: boolean;
	resizable?: boolean;
	toolWindow?: boolean;
	minimizeButton?: boolean;
	maximizeButton?: boolean;
	closeButton?: boolean;
};

/**
 * - `undefined` (default) -> `/${appID}` (unless `link` is set, which auto-skips routing).
 * - `string` -> explicit path (must begin with `/`).
 * - `false` -> exclude from per-app routing.
 */
export type AppRouteSpec = string | false;

export interface AppEntry {
	component?: Component;
	position: AppPosition;
	label: string | { icon: string; window: string };
	icon?: AppIcon;
	/** keep the component mounted when app is closed */
	persistent?: boolean;
	singleton?: boolean;
	/** route configuration (see {@link AppRouteSpec}) */
	route?: AppRouteSpec;
	link?: AppLink;
	/** defaults to `'window'` */
	chrome?: AppChrome;
}

export type IFrameAppOptions = Omit<InstanceType<typeof IFrameWindow>['$props'], 'appID'> & { appID: string };
export type RuffleAppOptions = Omit<InstanceType<typeof RuffleWindow>['$props'], 'appID'> & { appID: string };
export type V86AppOptions = Omit<InstanceType<typeof V86Window>['$props'], 'appID'> & { appID: string };
