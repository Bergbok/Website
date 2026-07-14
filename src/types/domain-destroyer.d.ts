declare module 'domain-destroyer' {
	interface Coordinates2D {
		x: number;
		y: number;
	}

	interface DestroyerOptions {
		/** initial volume level (0–1). default: 1 */
		defaultVolume?: number;
		/** called with the current pageHealth value each time a weapon fires */
		onDamage?: (pageHealth: number) => void;
		/** total "health" of the page, decremented on each shot. default: 100 */
		pageHealth?: number;
		/** max number of particle animators allowed at one time. default: 25 */
		particleLimit?: number;
		/** amount to increment/decrement volume per hotkey press. default: 0.11 */
		volumeChangeDelta?: number;
		/** z-index at which game elements begin layering. default: 1 */
		zIndexStart?: number;
	}

	class Destroyer {
		/** numeric ID of the currently active weapon */
		public currentWeaponID: number;
		/** whether the weapon is currently firing */
		public isFiring: boolean;
		/** current x/y position of the mouse within the viewport */
		public mousePos: Coordinates2D;
		/** current page health value */
		public pageHealth: number;
		/** max number of animated particle sprites allowed at one time */
		public particleLimit: number;
		/** current volume level (0–1) */
		public volume: number;

		public constructor(parent: HTMLElement, options?: DestroyerOptions);

		/** erase all persisted particles from the drawing layer */
		public clear(): void;
		/** fire the current weapon once */
		public fire(): void;
		/** inject game elements into the parent element and begin rendering */
		public inject(): void;
		/** remove all rendered content; state is preserved for re-injection */
		public selfDestruct(): void;
		/** explicitly set volume (0–1) */
		public setVolume(vol: number): void;
		/** explicitly set the active weapon by numeric ID */
		public setWeapon(id: number): void;
		/** update CSS variables for the current weapon */
		public updateCSS(): void;
		/** raise volume by volumeChangeDelta */
		public volumeUp(): void;
		/** lower volume by volumeChangeDelta */
		public volumeDown(): void;
		/** switch to the next weapon in the list */
		public weaponUp(): void;
		/** switch to the previous weapon in the list */
		public weaponDown(): void;
	}

	export { Destroyer };
	export default Destroyer;
}
