declare module 'hydra-synth' {
	export interface HydraRenderer {
		output: HydraOutput;
		synth: HydraSynth;
		render(source?: HydraSource): void;
		setResolution(width: number, height: number): void;
		canvas: HTMLCanvasElement;
	}

	export interface HydraOutput {
		screen(): void;
		renderAll(): void;
	}

	export interface HydraSynth {
		fps: number;
		width: number;
		height: number;
		time: number;
		mouse: HydraMouse;
		render(source?: HydraSource): void;
		setResolution(width: number, height: number): void;
	}

	export interface HydraMouse {
		x: number;
		y: number;
	}

	export interface HydraSource {
		out(buffer?: number): HydraSource;

		// Color operations
		brightness(amount: number): HydraSource;
		contrast(amount: number): HydraSource;
		color(r: number, g: number, b: number): HydraSource;
		colorama(amount: number): HydraSource;
		invert(amount?: number): HydraSource;
		luma(threshold?: number, tolerance?: number): HydraSource;
		posterize(bins: number, gamma?: number): HydraSource;
		saturate(amount: number): HydraSource;
		shift(r?: number, g?: number, b?: number, a?: number): HydraSource;
		thresh(threshold?: number, tolerance?: number): HydraSource;

		// Geometry operations
		kaleid(nSides: number): HydraSource;
		pixelate(pixelX: number, pixelY: number): HydraSource;
		repeat(repeatX: number, repeatY: number, offsetX?: number, offsetY?: number): HydraSource;
		rotate(angle: number, speed?: number): HydraSource;
		scale(amount: number, xMult?: number, yMult?: number): HydraSource;
		scrollX(scrollX: number, speed?: number): HydraSource;
		scrollY(scrollY: number, speed?: number): HydraSource;

		// Blend operations
		add(texture: HydraSource, amount?: number): HydraSource;
		blend(texture: HydraSource, amount?: number): HydraSource;
		diff(texture: HydraSource): HydraSource;
		layer(texture: HydraSource): HydraSource;
		mask(texture: HydraSource): HydraSource;
		mult(texture: HydraSource, amount?: number): HydraSource;

		// Modulate operations
		modulate(texture: HydraSource, amount?: number): HydraSource;
		modulateHue(texture: HydraSource, amount?: number): HydraSource;
		modulateKaleid(texture: HydraSource, nSides?: number): HydraSource;
		modulatePixelate(texture: HydraSource, multiple?: number, offset?: number): HydraSource;
		modulateRepeat(
			texture: HydraSource,
			repeatX?: number,
			repeatY?: number,
			offsetX?: number,
			offsetY?: number
		): HydraSource;
		modulateRotate(texture: HydraSource, multiple?: number, offset?: number): HydraSource;
		modulateScale(texture: HydraSource, multiple?: number, offset?: number): HydraSource;
		modulateScrollX(texture: HydraSource, scrollX?: number, speed?: number): HydraSource;
		modulateScrollY(texture: HydraSource, scrollY?: number, speed?: number): HydraSource;

		// Source generators
		noise(scale?: number, offset?: number): HydraSource;
		osc(frequency?: number, sync?: number, offset?: number): HydraSource;
		shape(sides?: number, radius?: number, smoothing?: number): HydraSource;
		solid(r?: number, g?: number, b?: number, a?: number): HydraSource;
		gradient(speed?: number): HydraSource;
		src(source: HydraSource): HydraSource;
		voronoi(scale?: number, speed?: number, blending?: number): HydraSource;
	}

	export default class Hydra {
		public constructor(opts?: {
			canvas?: HTMLCanvasElement;
			width?: number;
			height?: number;
			autoLoop?: boolean;
			makeGlobal?: boolean;
			detectAudio?: boolean;
			enableStreamCapture?: boolean;
			numSources?: number;
			numOutputs?: number;
			precision?: 'highp' | 'mediump' | 'lowp';
			pb?: unknown;
		});

		public synth: HydraSynth & Record<string, unknown>;
		public renderer: HydraRenderer;
		public captureStream: MediaStream | null;
		public eval(code: string): void;
		public hush(): void;
		public tick(dt: number): void;

		// Generator functions
		public noise(scale?: number, offset?: number): HydraSource;
		public osc(frequency?: number, sync?: number, offset?: number): HydraSource;
		public shape(sides?: number, radius?: number, smoothing?: number): HydraSource;
		public solid(r?: number, g?: number, b?: number, a?: number): HydraSource;
		public gradient(speed?: number): HydraSource;
		public src(source: HydraSource): HydraSource;
		public voronoi(scale?: number, speed?: number, blending?: number): HydraSource;

		// Utility methods
		public setResolution(width: number, height: number): void;
		public render(source?: HydraSource): void;
		public loop(): void;
		public stop(): void;
	}
}
