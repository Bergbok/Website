<script setup lang="ts">
import '@vuepic/vue-datepicker/dist/main.css';
import StartMenu from '@compunents/StartMenu.vue';
import StartMenuIcon from '@assets/images/scapegoats.avif';
import { storeToRefs } from 'pinia';
import { Button, Inset } from '@os-gui';
import { useWmStore } from '@store/wm.ts';
import { ref, useTemplateRef } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { useDesktopContext } from '@composables/useDesktop.ts';
import { useSortable } from '@vueuse/integrations/useSortable';
import { onClickOutside, useDateFormat, useNow } from '@vueuse/core';

const { taskbarEl } = useDesktopContext();

function setTaskbarRef(c: unknown): void {
	taskbarEl.value = (c as InstanceType<typeof Inset> | null)?.rootEl ?? null;
}

const startOpen = ref(false);
const startButtonEl = useTemplateRef<HTMLElement>('startButtonEl');
const startPanelEl = useTemplateRef<HTMLElement>('startPanelEl');

onClickOutside(
	startPanelEl,
	() => {
		startOpen.value = false;
	},
	{ ignore: [startButtonEl] }
);

const calendarOpen = ref(false);
const trayEl = useTemplateRef<HTMLElement>('trayEl');
const calendarPanelEl = useTemplateRef<HTMLElement>('calendarPanelEl');

onClickOutside(
	calendarPanelEl,
	() => {
		calendarOpen.value = false;
	},
	{ ignore: [trayEl] }
);

const selectedDate = ref(new Date());

const wm = useWmStore();
const time = useDateFormat(useNow(), 'YYYY-MM-DD HH:mm:ss');
const { taskOrder, taskbarTasks, focusedWindowID } = storeToRefs(wm);

const tasksEl = useTemplateRef<HTMLElement>('tasksEl');

useSortable(tasksEl, taskOrder, { animation: 150 });
</script>

<template>
	<Inset :ref="setTaskbarRef" type="outset" as="footer" class="bar">
		<Button ref="startButtonEl" variant="toggle" :pressed="startOpen" class="start" @click="startOpen = !startOpen">
			<img :src="StartMenuIcon" alt="" class="icon" />
		</Button>

		<Inset v-if="startOpen" ref="startPanelEl" type="outset" depth="deep" class="panel">
			<StartMenu @close="startOpen = false" />
		</Inset>

		<div ref="tasksEl" class="tasks">
			<Button
				v-for="task in taskbarTasks"
				:key="task.id"
				variant="toggle"
				:pressed="focusedWindowID === task.id"
				class="task"
				@click="wm.toggleFromTaskbar(task.id)">
				<img v-if="task.icon" :src="task.icon" class="icon" alt="" />
				<span class="label">{{ task.label }}</span>
			</Button>
		</div>

		<Inset ref="trayEl" class="tray" @click="calendarOpen = !calendarOpen">
			<time :datetime="time">{{ time }}</time>
		</Inset>

		<div v-if="calendarOpen" ref="calendarPanelEl" class="calendar">
			<VueDatePicker v-model="selectedDate" inline auto-apply :enable-time-picker="false" />
		</div>
	</Inset>
</template>

<style scoped>
:deep(button.dp--arrow-btn-nav) {
	height: 35px;
}

.bar {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: var(--taskbar-h);
	background: var(--ButtonFace, #c0c0c0);
	display: flex;
	align-items: stretch;
	padding: 2px;
	gap: 2px;
	box-sizing: border-box;

	& .start {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2px;
		flex-shrink: 0;

		& .icon {
			width: 100%;
			height: 100%;
			object-fit: contain;
			image-rendering: pixelated;
		}
	}

	& .panel {
		position: absolute;
		bottom: 100%;
		left: 0;
		width: clamp(160px, 20%, 240px);
		min-height: 120px;
		background: var(--ButtonFace, #c0c0c0);
		z-index: 200;
		padding: 4px;
		box-sizing: border-box;
	}

	& .tasks {
		flex: 1;
		display: flex;
		align-items: stretch;
		gap: 2px;
		overflow: scroll;
		min-width: 0;

		& .task {
			aspect-ratio: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 2px;
			min-width: 0;
			flex-shrink: 0;
			overflow: hidden;

			& .icon {
				width: 100%;
				height: 100%;
				object-fit: contain;
				image-rendering: pixelated;
				max-width: 100%;
				max-height: 100%;
			}

			& .label {
				display: none;
				font-size: clamp(9px, 1.1vw, 12px);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}
	}

	& .tray {
		cursor: default;
		display: flex;
		align-items: center;
		padding: 0 6px;
		flex-shrink: 0;

		& time {
			font-size: clamp(9px, 1.1vw, 12px);
			white-space: nowrap;
		}
	}

	& .calendar {
		position: absolute;
		bottom: 100%;
		right: 0;
		z-index: 200;
	}
}
</style>
