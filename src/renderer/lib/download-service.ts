import { EventEmitter } from 'events';
import fs from 'fs';
import { downloadLibrariesIfNotExists } from './dependency-updaters';
import { existsAsync } from './utilities';
import { VideoDownloadTask } from './video-download';

const DOWNLOAD_STARTED_EVENT = 'DOWNLOAD_STARTED';

export class DownloadService {
    private eventEmitter: EventEmitter = new EventEmitter();
    private downloadTasks: { [url: string]: VideoDownloadTask } = {};

    public queueDownload(url: string): void {
        void this.downloadVideo(url);
    }

    public addDownloadStartedListener(fn: (downloadTask: VideoDownloadTask) => void): void {
        this.eventEmitter.addListener(DOWNLOAD_STARTED_EVENT, fn);
    }

    private async downloadVideo(url: string): Promise<void> {
        if (this.downloadTasks[url]) {
            console.error(`Already downloading ${url}`);
            return;
        }

        // TODO move to app initialization
        if (!(await existsAsync('./bin/'))) {
            await fs.promises.mkdir('./bin/');
        }
        await downloadLibrariesIfNotExists();

        this.downloadTasks[url] = new VideoDownloadTask(url);

        this.eventEmitter.emit(DOWNLOAD_STARTED_EVENT, this.downloadTasks[url]);
        await this.downloadTasks[url].download();

        delete this.downloadTasks[url];
    }
}
