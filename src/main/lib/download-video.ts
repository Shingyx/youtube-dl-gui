import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import { URL } from 'url';
import { downloadLibrariesIfNotExists } from './dependency-updaters';
import { downloadString } from './utilities';

enum DownloadState {
    INITIALIZING,
    DOWNLOADING_VIDEO,
    DOWNLOADING_AUDIO,
    MERGING_FORMATS,
    COMPLETE,
}

export async function downloadVideo(url: string): Promise<void> {
    try {
        new URL(url); // tslint:disable-line:no-unused-expression
    } catch {
        throw new Error(`"${url}" is not a valid URL`);
    }

    if (!fs.existsSync('./bin/')) {
        fs.mkdirSync('./bin/');
    }

    await downloadLibrariesIfNotExists();

    const videoDownloadTask = new VideoDownloadTask(url);
    console.log(`Downloading "${url}"...`);
    await videoDownloadTask.download();
    console.log(videoDownloadTask.getErrorMessage() || 'Download complete!');
}

class VideoDownloadTask {
    private downloadState: DownloadState = DownloadState.INITIALIZING;
    private videoId: string | undefined;
    private errorMessage: string | undefined;

    constructor(private readonly url: string) {}

    public download(): Promise<void> {
        return new Promise((resolve) => {
            const child = this.spawnDownloadProcess();
            child.stdout.on('data', (data) => this.processData(data));
            child.stderr.on('data', (data) => this.processData(data));
            child.on('close', () => {
                this.downloadState = DownloadState.COMPLETE;
                resolve();
            });
        });
    }

    public getErrorMessage(): string | undefined {
        return this.errorMessage;
    }

    private spawnDownloadProcess(): ChildProcess {
        return spawn('./bin/youtube-dl.exe', [
            '--ffmpeg-location',
            './bin/ffmpeg.exe',
            '-o',
            './bin/test.%(ext)s', // './%(title)s.%(ext)s',
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
            const parts = line.split(/\s+/);
            switch (parts[0]) {
                case '[youtube]': {
                    if (!this.videoId) {
                        const videoId = parts[1].slice(0, -1);
                        const videoInfoUrl = `https://youtube.com/get_video_info?video_id=${videoId}`;
                        downloadString(videoInfoUrl)
                            .then((response) => {
                                let videoTitle;
                                const titleRegex = /^title=(.*)$/;
                                for (const query of response.split('&')) {
                                    const result = titleRegex.exec(query);
                                    if (result) {
                                        const encodedTitle = result[1].replace(/\+/g, '%20');
                                        videoTitle = decodeURIComponent(encodedTitle);
                                        break;
                                    }
                                }
                                console.log(`Title: "${videoTitle}"`);
                            })
                            .catch(() => {
                                console.error(`Failed to retrieve video title for ${videoId}`);
                            });
                        this.videoId = videoId;
                    }
                    break;
                }
                case '[download]': {
                    if (parts[1] === 'Destination:') {
                        if (line.endsWith('.mp4')) {
                            this.downloadState = DownloadState.DOWNLOADING_VIDEO;
                            console.log('Downloading video');
                        } else if (line.endsWith('.m4a')) {
                            this.downloadState = DownloadState.DOWNLOADING_AUDIO;
                            console.log('Downloading audio');
                        }
                    } else if (parts[1].endsWith('%')) {
                        let percentage = Math.min(99.9, Number(parts[1].slice(0, -1)));
                        if (this.downloadState === DownloadState.DOWNLOADING_AUDIO) {
                            percentage = 100 + percentage / 10;
                        }
                        let out = `percentage=${(percentage / 1.1).toFixed(2)}%`;
                        if (line.includes('ETA') && !line.includes('Unknown')) {
                            out += `\tspeed=${parts[5]}\teta=${parts[7]}`;
                        }
                        console.log(out);
                    } else if (/has already been downloaded( and merged)?$/.test(line)) {
                        console.log('Already downloaded');
                    }
                    break;
                }
                case '[ffmpeg]': {
                    if (parts[1] === 'Merging' && parts[2] === 'formats') {
                        this.downloadState = DownloadState.MERGING_FORMATS;
                        console.log('Merging video and audio');
                    }
                    break;
                }
                case 'ERROR:': {
                    this.errorMessage = line.substring('ERROR:'.length).trim();
                    break;
                }
            }
        }
    }
}
