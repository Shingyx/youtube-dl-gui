import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { downloadString } from './utilities';

const INITIALIZING = 'Initializing';
const DOWNLOADING_VIDEO = 'Downloading video';
const DOWNLOADING_AUDIO = 'Downloading audio';
const MERGING_FORMATS = 'Merging video and audio';

const STATE_CHANGED_EVENT = 'STATE_CHANGED';

export interface IVideoDownloadState {
    video: string;
    progress: number;
    status: string;
    speed: string;
    eta: string;
    done: boolean;
}

export class VideoDownloadTask {
    private readonly eventEmitter: EventEmitter = new EventEmitter();
    private readonly state: IVideoDownloadState = {
        video: this.url,
        progress: 0,
        status: INITIALIZING,
        speed: '-',
        eta: '-',
        done: false,
    };
    private completeMessage: string = 'Complete';
    private videoId: string | undefined;

    constructor(private readonly url: string, private readonly outputDirectory: string) {}

    public async download(): Promise<void> {
        await new Promise((resolve) => {
            const child = this.spawnDownloadProcess();
            child.stdout.on('data', (data) => this.processData(data));
            child.stderr.on('data', (data) => this.processData(data));
            child.on('close', () => resolve());
        });
        this.state.status = this.completeMessage;
        this.state.progress = 1;
        this.state.speed = '-';
        this.state.eta = '-';
        this.state.done = true;
        this.emitStateChanged();
        this.eventEmitter.removeAllListeners();
    }

    public getState(): IVideoDownloadState {
        return this.state;
    }

    public addStateChangedListener(fn: (state: IVideoDownloadState) => void): void {
        this.eventEmitter.addListener(STATE_CHANGED_EVENT, fn);
    }

    private spawnDownloadProcess(): ChildProcess {
        return spawn('./bin/youtube-dl.exe', [
            '--ffmpeg-location',
            './bin/ffmpeg.exe',
            '-o',
            path.join(this.outputDirectory, '%(title)s.%(ext)s'),
            '-f',
            'worstvideo[ext=mp4]+worstaudio[ext=m4a]', // 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
            '-r',
            '2M',
            '--newline',
            this.url,
        ]);
    }

    private processData(data: Buffer): void {
        const lines = data
            .toString()
            .trim()
            .split('\n');
        for (const line of lines) {
            this.processLine(line);
        }
        this.emitStateChanged();
    }

    private processLine(line: string): void {
        const parts = line.split(/\s+/);
        switch (parts[0]) {
            case '[youtube]': {
                if (!this.videoId) {
                    this.videoId = parts[1].slice(0, -1);
                    void this.fetchVideoTitle(this.videoId);
                }
                break;
            }
            case '[download]': {
                if (parts[1] === 'Destination:') {
                    if (line.endsWith('.mp4')) {
                        this.state.status = DOWNLOADING_VIDEO;
                    } else if (line.endsWith('.m4a')) {
                        this.state.status = DOWNLOADING_AUDIO;
                    }
                } else if (parts[1].endsWith('%')) {
                    let progress = Math.min(99.9, Number(parts[1].slice(0, -1)));
                    if (this.state.status === DOWNLOADING_AUDIO) {
                        progress = 100 + progress / 10;
                    }
                    this.state.progress = progress / 110;

                    if (line.includes('ETA') && !line.includes('Unknown')) {
                        this.state.speed = parts[5];
                        this.state.eta = parts[7];
                    }
                } else if (/has already been downloaded( and merged)?$/.test(line)) {
                    this.completeMessage = 'Already downloaded';
                }
                break;
            }
            case '[ffmpeg]': {
                if (parts[1] === 'Merging' && parts[2] === 'formats') {
                    this.state.status = MERGING_FORMATS;
                }
                break;
            }
            case 'ERROR:': {
                this.completeMessage = `Error: ${line.substring('ERROR:'.length).trim()}`;
                break;
            }
        }
    }

    private async fetchVideoTitle(videoId: string): Promise<void> {
        let videoTitle;
        try {
            const videoInfoUrl = `https://youtube.com/get_video_info?video_id=${videoId}`;
            const response = await downloadString(videoInfoUrl);
            const titleRegex = /^title=(.*)$/;
            for (const query of response.split('&')) {
                const result = titleRegex.exec(query);
                if (result) {
                    const encodedTitle = result[1].replace(/\+/g, '%20');
                    videoTitle = decodeURIComponent(encodedTitle);
                    break;
                }
            }
        } catch {
            // it tried
        }
        if (videoTitle && !this.state.done) {
            this.state.video = videoTitle;
            this.emitStateChanged();
        }
    }

    private emitStateChanged(): void {
        this.eventEmitter.emit(STATE_CHANGED_EVENT, this.state);
    }
}
