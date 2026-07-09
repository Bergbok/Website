declare module 'domain-destroyer' {
	interface Coordinates2D {
		x: number;
		y: number;
	}

	interface DestroyerOptions {
		/** Initial volume level (0–1). Default: 1 */
		defaultVolume?: number;
		/** Called with the current pageHealth value each time a weapon fires */
		onDamage?: (pageHealth: number) => void;
		/** Total "health" of the page, decremented on each shot. Default: 100 */
		pageHealth?: number;
		/** Max number of particle animators allowed at one time. Default: 25 */
		particleLimit?: number;
		/** Amount to increment/decrement volume per hotkey press. Default: 0.11 */
		volumeChangeDelta?: number;
		/** z-index at which game elements begin layering. Default: 1 */
		zIndexStart?: number;
	}

	class Destroyer {
		/** Numeric ID of the currently active weapon */
		public currentWeaponID: number;
		/** Whether the weapon is currently firing */
		public isFiring: boolean;
		/** Current x/y position of the mouse within the viewport */
		public mousePos: Coordinates2D;
		/** Current page health value */
		public pageHealth: number;
		/** Max number of animated particle sprites allowed at one time */
		public particleLimit: number;
		/** Current volume level (0–1) */
		public volume: number;

		public constructor(parent: HTMLElement, options?: DestroyerOptions);

		/** Erase all persisted particles from the drawing layer */
		public clear(): void;
		/** Fire the current weapon once */
		public fire(): void;
		/** Inject game elements into the parent element and begin rendering */
		public inject(): void;
		/** Remove all rendered content; state is preserved for re-injection */
		public selfDestruct(): void;
		/** Explicitly set volume (0–1) */
		public setVolume(vol: number): void;
		/** Explicitly set the active weapon by numeric ID */
		public setWeapon(id: number): void;
		/** Update CSS variables for the current weapon */
		public updateCSS(): void;
		/** Raise volume by volumeChangeDelta */
		public volumeUp(): void;
		/** Lower volume by volumeChangeDelta */
		public volumeDown(): void;
		/** Switch to the next weapon in the list */
		public weaponUp(): void;
		/** Switch to the previous weapon in the list */
		public weaponDown(): void;
	}

	export { Destroyer };
	export default Destroyer;
}
