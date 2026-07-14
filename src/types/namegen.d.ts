export interface GenerateOptions {
	/** Highest order of model to use - models of order 1 through order will be generated. */
	order?: number;
	/** The dirichlet prior/additive smoothing "randomness" factor. */
	prior?: number;
	/** Whether to fall back to lower order models when the highest order model fails to generate a letter. */
	backoff?: boolean;
	/** The minimum length of the word. */
	minLength?: number;
	/** The maximum length of the word. */
	maxLength?: number;
	/** The text the word must start with. */
	startsWith?: string;
	/** The text the word must end with. */
	endsWith?: string;
	/** The text the word must include. */
	includes?: string;
	/** The text the word must exclude. */
	excludes?: string;
	regexMatch?: string;
	/** The maximum time in seconds to spend generating each name. */
	maxTimePerName?: number;
}

export interface HaxeEReg {
	r: RegExp;
	match(s: string): boolean;
}

export interface HaxeNameGenerator {
	generateName(
		minLength: number,
		maxLength: number,
		startsWith: string,
		endsWith: string,
		includes: string,
		excludes: string,
		regexMatch: HaxeEReg | null
	): string | null;
	generateNames(
		n: number,
		minLength: number,
		maxLength: number,
		startsWith: string,
		endsWith: string,
		includes: string,
		excludes: string,
		maxTimePerName: number,
		regexMatch: HaxeEReg | null
	): string[];
}

declare global {
	interface Window {
		NameGenerator: new (data: string[], order: number, prior: number, backoff?: boolean) => HaxeNameGenerator;
		markovLoaded?: boolean;
	}
}
