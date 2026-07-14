import AppRoute from '@views/AppRoute.vue';
import { APPS, getApp } from '@components/computer/apps';
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const staticRoutes: RouteRecordRaw[] = [
	{
		name: 'Desktop',
		path: '/',
		component: async () =>
			/^\/\?+$/.test(window.location.pathname + window.location.search)
				? import('@views/404.vue')
				: import('@views/Desktop.vue')
	},
	{
		name: 'Fingal',
		path: '/fingal',
		alias: '/fingalfunny',
		component: async () => import('@views/Fingal.vue')
	},
	{
		name: 'Rickroll',
		path: '/rickroll',
		alias: '/funnyvideo',
		component: async () => import('@views/Rickroll.vue')
	},
	{
		name: 'VoidStranger',
		path: '/DIS',
		component: async () => import('@views/404.vue')
	}
];

const appRoutes: RouteRecordRaw[] = Object.keys(APPS).flatMap((id) => {
	const appID = id as keyof typeof APPS;
	const entry = getApp(appID);
	if (entry.route === false || typeof entry.link === 'string') {
		return [];
	}
	return [
		{
			name: `app:${appID}`,
			path: typeof entry.route === 'string' ? entry.route : `/${appID}`,
			props: { appID },
			component: AppRoute
		}
	];
});

const 〤〇〤: RouteRecordRaw = {
	name: 'NotFound',
	path: '/:pathMatch(.*)*',
	component: async () => import('@views/404.vue')
};

const router = createRouter({
	history: createWebHistory(),
	routes: [...staticRoutes, ...appRoutes, 〤〇〤]
});

export default router;
