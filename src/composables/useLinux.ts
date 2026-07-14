import linuxWorkerUrl from '@lib/linux/linux-worker.js?url';

export interface LinuxInstance {
	keyInput(data: string): void;
}

interface Locks {
	serialize: number;
	_memory: Int32Array;
}

interface Cpu {
	worker: Worker;
	locks: Locks;
	lastTask: Uint32Array;
}

interface TaskOptions {
	runner_type: 'primary_cpu' | 'secondary_cpu' | 'task';
	start_stack?: number;
	boot_cmdline?: string;
	initrd?: ArrayBuffer | null;
	prev_task?: number;
	new_task?: number;
	user_executable?: {
		bin_start: number;
		bin_end: number;
		data_start: number;
		table_start: number;
	} | null;
}

type LockName = Exclude<keyof Locks, '_memory'>;

type MessageCallback = (message: Record<string, unknown>, worker?: Worker) => void;

function lockNotify(locks: Locks, lock: LockName, count?: number): void {
	Atomics.store(locks._memory, locks[lock], 1);
	Atomics.notify(locks._memory, locks[lock], count || 1);
}

export async function createLinux(
	vmlinuxModule: WebAssembly.Module,
	bootCmdline: string,
	initrd: ArrayBuffer,
	log: (text: string) => void,
	consoleWrite: (data: string) => void
): Promise<LinuxInstance> {
	const cpus = new Map<number, Cpu>();
	const tasks = new Map<number, Cpu>();

	const textEncoder = new TextEncoder();

	let inputBuffer = new ArrayBuffer(0);

	const memory = new WebAssembly.Memory({
		initial: 30,
		maximum: 0x1_00_00,
		shared: true
	});

	const messageCallbacks: Record<string, MessageCallback> = {};

	const makeRunner = (name: string, options: TaskOptions): Cpu => {
		const worker = new Worker(linuxWorkerUrl, { name });

		const locks: Locks = Object.create(null) as Locks;
		locks.serialize = 0;
		locks._memory = new Int32Array(new SharedArrayBuffer(4));

		const lastTask = new Uint32Array(new SharedArrayBuffer(4));

		worker.addEventListener('error', (error): void => {
			throw error;
		});

		worker.addEventListener('message', (event: MessageEvent): void => {
			const data = event.data as Record<string, unknown>;
			messageCallbacks[data.method as string]!(data, worker);
		});

		worker.addEventListener('messageerror', (error): void => {
			throw error;
		});

		worker.postMessage({
			...options,
			method: 'init',
			vmlinux: vmlinuxModule,
			memory,
			locks,
			last_task: lastTask,
			runner_name: name
		});

		return { worker, locks, lastTask };
	};

	const makeCpu = (cpu: number, idleTask: number, startStack: number): void => {
		const options: TaskOptions = {
			runner_type: cpu === 0 ? 'primary_cpu' : 'secondary_cpu',
			start_stack: startStack
		};

		if (cpu === 0) {
			options.boot_cmdline = bootCmdline;
			options.initrd = initrd;
		}

		const name = `CPU ${cpu} [boot+idle]${cpu !== 0 ? ` (${idleTask})` : ''}`;

		const runner = makeRunner(name, options);
		cpus.set(cpu, runner);
		if (cpu !== 0) {
			tasks.set(idleTask, runner);
		}
	};

	const makeTask = (
		prevTask: number,
		newTask: number,
		name: string,
		userExecutable: TaskOptions['user_executable']
	): void => {
		const options: TaskOptions = {
			runner_type: 'task',
			prev_task: prevTask,
			new_task: newTask,
			user_executable: userExecutable
		};
		tasks.set(newTask, makeRunner(`${name} (${newTask})`, options));
	};

	const startPrimary: MessageCallback = (message): void => {
		const initTask = message.init_task! as number;
		log(`Starting cpu 0 with init_task ${String(initTask)}`);
		tasks.set(initTask, cpus.get(0)!);
	};
	messageCallbacks.start_primary = startPrimary;

	const startSecondary: MessageCallback = (message): void => {
		const cpu = message.cpu! as number;
		if (cpu <= 0) {
			throw new Error('Trying to start secondary cpu with ID <= 0');
		}
		log(
			`Starting cpu ${String(cpu)} (${String(message.idle_task)}) with start stack ${String(message.start_stack)}`
		);
		makeCpu(cpu, message.idle_task! as number, message.start_stack! as number);
	};
	messageCallbacks.start_secondary = startSecondary;

	const stopSecondary: MessageCallback = (message): void => {
		const cpu = message.cpu! as number;
		if (cpu <= 0) {
			throw new Error('Trying to stop secondary cpu with ID 0');
		}
		const entry = cpus.get(cpu);
		if (entry) {
			log(`[Main]: Stopping CPU ${String(cpu)}`);
			entry.worker.terminate();
			cpus.delete(cpu);
		}
	};
	messageCallbacks.stop_secondary = stopSecondary;

	const createAndRunTask: MessageCallback = (message): void => {
		makeTask(
			message.prev_task! as number,
			message.new_task! as number,
			message.name! as string,
			(message.user_executable as TaskOptions['user_executable']) || null
		);
	};
	messageCallbacks.create_and_run_task = createAndRunTask;

	const releaseTask: MessageCallback = (message): void => {
		const deadTask = message.dead_task! as number;
		tasks.get(deadTask)!.worker.terminate();
		tasks.delete(deadTask);
	};
	messageCallbacks.release_task = releaseTask;

	const serializeTasks: MessageCallback = (message): void => {
		const nextTask = tasks.get(message.next_task! as number)!;
		nextTask.lastTask[0] = message.prev_task! as number;
		lockNotify(nextTask.locks, 'serialize');
	};
	messageCallbacks.serialize_tasks = serializeTasks;

	const consoleRead: MessageCallback = (message): void => {
		const memoryU8 = new Uint8Array(memory.buffer);
		const buffer = new Uint8Array(inputBuffer);
		const count = message.count! as number;
		const used = buffer.slice(0, count);
		memoryU8.set(used, message.buffer! as number);
		inputBuffer = buffer.slice(count).buffer;

		const messenger = message.console_read_messenger as Int32Array;
		Atomics.store(messenger, 0, used.length);
		Atomics.notify(messenger, 0, 1);
	};
	messageCallbacks.console_read = consoleRead;

	const consoleWriteCb: MessageCallback = (message): void => {
		consoleWrite(message.message! as string);
	};
	messageCallbacks.console_write = consoleWriteCb;

	const logCb: MessageCallback = (message): void => {
		log(message.message! as string);
	};
	messageCallbacks.log = logCb;

	makeCpu(0, 0, 0);

	return {
		keyInput(data: string): void {
			const keyBuffer = textEncoder.encode(data);
			const oldSize = inputBuffer.byteLength;
			const newBuf = new ArrayBuffer(oldSize + keyBuffer.byteLength);
			new Uint8Array(newBuf).set(new Uint8Array(inputBuffer), 0);
			new Uint8Array(newBuf).set(keyBuffer, oldSize);
			inputBuffer = newBuf;
		}
	};
}
