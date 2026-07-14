import KonamiCode from 'konami-code-js';
import { onUnmounted } from 'vue';

interface UseKonamiCodeOptions {
	callback: () => void;
}

export function useKonamiCode(options: UseKonamiCodeOptions): void {
	const instance = new KonamiCode(options.callback);

	onUnmounted(() => {
		instance.disable();
	});
}
