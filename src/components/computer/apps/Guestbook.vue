<script setup lang="ts">
import 'vue-virtual-scroller/index.css';
import Turnstile from 'vue-cloudflare-turnstile';
import AppWindow from '@compunents/AppWindow.vue';
import { Button, MenuBar } from '@os-gui';
import { useAppOpen } from '@composables/useApp.ts';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { formatTimeAgo, get, useCountdown, useFetch } from '@vueuse/core';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';

interface GuestbookMessage {
	id: number;
	name: string;
	content: string;
	date: string;
	pending?: boolean;
}

const appWindowRef = useTemplateRef<InstanceType<typeof AppWindow>>('appWindow');
const content = ref('');
const linkPattern = /https?:\/\/[^\s]+/gi;
const name = ref('');
const showPending = ref(false);
const status = ref('');
const submitting = ref(false);
const token = ref('');
const turnstileRef = useTemplateRef<InstanceType<typeof Turnstile>>('turnstile');
const turnstileSiteKey = __TURNSTILE_SITEKEY__;
const { isOpen, appOpenListeners } = useAppOpen();
const { remaining, start: startCountdown } = useCountdown(0);

const {
	data: fetchData,
	isFetching: loading,
	error: fetchError,
	execute: read
} = useFetch(() => `/guestbook/read${get(showPending) ? '?pending=true' : ''}`, { immediate: false }).json<{
	messages: GuestbookMessage[];
}>();

const buttonLabel = computed(() => {
	if (get(submitting)) {
		return 'Submitting...';
	}
	const parts: string[] = [];
	if (get(status)) {
		parts.push(get(status));
	}
	if (get(remaining) > 0) {
		parts.push(`${get(remaining)}s`);
	}
	return parts.length ? parts.join(' ') : 'Submit';
});

async function write(): Promise<void> {
	const trimmedName = get(name).trim();
	const trimmedContent = get(content).trim();
	if (!trimmedName || !trimmedContent || get(submitting) || !get(token)) {
		return;
	}
	submitting.value = true;
	status.value = '';
	try {
		const res = await fetch('/guestbook/write', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: trimmedName, content: trimmedContent, token: get(token) })
		});
		const result = (await res.json()) as { ok?: boolean; pending?: boolean; error?: string };
		if (!res.ok || !result.ok) {
			status.value = result.error ?? 'submission failed';
			if (res.status === 429 && get(remaining) === 0) {
				startCountdown(Number(res.headers.get('Retry-After') || 60));
			}
			get(turnstileRef)?.reset();
			return;
		}
		startCountdown(60);
		get(turnstileRef)?.reset();
		if (result.pending) {
			status.value = 'okay (approval pending)';
		} else {
			status.value = 'okay, cool';
			await read();
		}
		content.value = '';
	} catch {
		status.value = 'network error';
		get(turnstileRef)?.reset();
	} finally {
		submitting.value = false;
	}
}

function parseMessage(text: string): { type: 'text' | 'link'; value: string }[] {
	const segments: { type: 'text' | 'link'; value: string }[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null = null;
	while ((match = linkPattern.exec(text)) !== null) {
		if (match.index > lastIndex) {
			segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
		}
		segments.push({ type: 'link', value: match[0] });
		({ lastIndex } = linkPattern);
	}
	if (lastIndex < text.length) {
		segments.push({ type: 'text', value: text.slice(lastIndex) });
	}
	return segments;
}

const menus: OSGUITopLevelMenus = {
	'&File': [{ label: 'E&xit', action: () => get(appWindowRef)?.close() }],
	'&View': [
		{
			label: '&RSS',
			action: () => window.open('/guestbook/rss', '_blank')
		},
		{
			label: '&Edit',
			action: () =>
				window.open(
					'https://dash.cloudflare.com/?to=/:account/workers/d1/databases/52f5a05b-79ee-4ded-900b-efd1d20316d9/studio',
					'_blank'
				)
		},
		{
			label: '&Pending',
			checkbox: {
				check: () => get(showPending),
				toggle: () => {
					showPending.value = !get(showPending);
					read();
				}
			}
		}
	]
};

watch(isOpen, (nowOpen) => {
	if (nowOpen) {
		read();
	}
});
</script>

<template>
	<AppWindow ref="appWindow" app-i-d="guestbook" v-on="appOpenListeners">
		<template #menubar>
			<MenuBar :menus="menus" />
		</template>
		<div class="body">
			<form class="form" @submit.prevent="write">
				<label class="row">
					<span>from</span>
					<input v-model="name" type="text" maxlength="64" required :disabled="submitting" />
				</label>
				<label class="row">
					<span>message</span>
					<textarea v-model="content" rows="3" required :disabled="submitting" />
				</label>
				<Turnstile
					ref="turnstile"
					theme="light"
					size="flexible"
					:site-key="turnstileSiteKey"
					@success="token = $event" />
				<Button class="submit" type="submit" variant="default" :disabled="!token || submitting">
					{{ buttonLabel }}
				</Button>
			</form>

			<div v-if="fetchData?.messages?.length" class="list">
				<DynamicScroller
					ref="scroller"
					:items="fetchData!.messages"
					:min-item-size="54"
					key-field="id"
					class="scroller">
					<template #default="{ item, index, active }">
						<DynamicScrollerItem :item="item" :active="active" :index="index">
							<div class="entry" :class="{ pending: item.pending }">
								<div class="header">
									<span class="name">{{ item.name }}</span>
									<time
										class="date"
										:title="new Date(item.date).toLocaleString()"
										:datetime="item.date"
										>{{ formatTimeAgo(new Date(item.date)) }}</time
									>
								</div>
								<div class="content">
									<template v-for="(seg, i) in parseMessage(item.content)" :key="i">
										<a v-if="seg.type === 'link'" :href="seg.value" target="_blank">{{
											seg.value
										}}</a>
										<template v-else>{{ seg.value }}</template>
									</template>
								</div>
							</div>
						</DynamicScrollerItem>
					</template>
				</DynamicScroller>
			</div>
			<div v-else-if="loading" class="empty">loading...</div>
			<div v-else-if="fetchError" class="empty">failed to load messages</div>
			<div v-else class="empty">no entries yet</div>
		</div>
	</AppWindow>
</template>

<style scoped>
.body {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 8px;
	height: 100%;
	overflow: hidden;

	& .form {
		display: flex;
		flex-direction: column;
		gap: 6px;

		& .row {
			display: flex;
			flex-direction: column;
			gap: 2px;
			font-size: 12px;

			& input,
			& textarea {
				font-size: 13px;
				padding: 4px 6px;
			}

			& textarea {
				resize: vertical;
			}
		}

		& .submit {
			width: 100%;
		}
	}

	& .list {
		overflow: hidden;
		flex: 1 1 auto;
		min-height: 0;

		& .scroller {
			height: 100%;
		}

		& .entry {
			border: 1px solid rgba(0, 0, 0, 0.2);
			padding: 4px 6px;
			background: rgba(255, 255, 255, 0.5);

			& .header {
				display: flex;
				justify-content: space-between;
				align-items: baseline;
				gap: 8px;

				& .name {
					font-weight: bold;
					font-size: 12px;
				}

				& .date {
					font-size: 11px;
					opacity: 0.6;
					white-space: nowrap;
				}
			}

			& .content {
				font-size: 13px;
				white-space: pre-wrap;
				overflow-wrap: anywhere;

				& a {
					color: inherit;
					text-decoration: underline;
				}
			}
		}

		& .pending {
			border-color: rgba(255, 0, 21, 0.932);
			background: rgba(211, 20, 3, 0.08);
		}
	}

	& .empty {
		font-size: 12px;
		opacity: 0.7;
		padding: 8px 4px;
	}
}
</style>
