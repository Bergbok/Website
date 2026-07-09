declare namespace Twitch {
	interface VideoStatistics {
		backendVersion: string;
		bufferSize: number;
		codecs: string;
		displayResolution: string;
		fps: number;
		hlsLatencyBroadcaster: number;
		latencyMode: string;
		playbackRate: number;
		skippedFrames: number;
		videoResolution: string;
	}

	interface PlaybackStatistics {
		videoStatistics: VideoStatistics;
	}

	interface Quality {
		bitrate: number;
		codecs: string;
		framerate?: number;
		group: string;
		height: number;
		isDefault: boolean;
		name: string;
		width: number;
	}

	interface PlayerOptions {
		readonly autoplay?: boolean;
		readonly channel?: string;
		readonly collection?: string;
		readonly height: number | string;
		readonly muted?: boolean;
		readonly parent?: string[];
		readonly time?: string;
		readonly video?: string;
		readonly width: number | string;
	}

	class Player {
		public static readonly READY: 'ready';
		public static readonly PLAYING: 'playing';
		public static readonly ENDED: 'ended';
		public static readonly PAUSE: 'pause';
		public static readonly ERROR: 'error';
		public constructor(divID: string, options: PlayerOptions);
		public addEventListener(event: string, handler: () => void): void;
		public disableCaptions(): void;
		public enableCaptions(): void;
		public getChannel(): string | undefined;
		public getChannelId(): string | undefined;
		public getCollection(): string | undefined;
		public getCurrentTime(): number;
		public getDuration(): number;
		public getEnded(): boolean;
		public getMuted(): boolean;
		public getPlaybackStats(): PlaybackStatistics;
		public getQualities(): Quality[];
		public getQuality(): string;
		public getVideo(): string | undefined;
		public getVolume(): number;
		public isPaused(): boolean;
		public pause(): void;
		public play(): void;
		public seek(timestamp: number): void;
		public setChannel(channel: string): void;
		public setChannelId(channelID: string): void;
		public setCollection(collectionID: string, videoID?: string): void;
		public setMuted(muted: boolean): void;
		public setQuality(quality: string): void;
		public setVideo(videoID: string, timestamp: number): void;
		public setVolume(volumeLevel: number): void;
	}

	interface EmbedOptions {
		allowFullscreen?: boolean;
		autoplay?: boolean;
		channel?: string;
		collection?: string;
		height: number | string;
		layout?: 'video' | 'video-with-chat';
		muted?: boolean;
		parent?: string[];
		theme?: 'dark' | 'light';
		time?: string;
		video?: string;
		width: number | string;
	}

	class Embed {
		public constructor(divID: string, options: EmbedOptions);
		public addEventListener(event: string, handler: () => void): void;
		public disableCaptions(): void;
		public enableCaptions(): void;
		public getChannel(): string | undefined;
		public getChannelId(): string | undefined;
		public getCollection(): string | undefined;
		public getCurrentTime(): number;
		public getDuration(): number;
		public getEnded(): boolean;
		public getMuted(): boolean;
		public getPlaybackStats(): PlaybackStatistics;
		public getPlayer(): Player;
		public getQualities(): Quality[];
		public getQuality(): string;
		public getVideo(): string | undefined;
		public getVolume(): number;
		public isPaused(): boolean;
		public pause(): void;
		public play(): void;
		public seek(timestamp: number): void;
		public setChannel(channelName: string): void;
		public setChannelId(channelID: string): void;
		public setCollection(collectionID: string, videoID?: string): void;
		public setMuted(muted: boolean): void;
		public setQuality(quality: string): void;
		public setVideo(videoID: string, timestamp: number): void;
		public setVolume(volumeLevel: number): void;
	}
}
