import { EventEmitter } from 'events';
import { toast } from 'react-toastify';
import { initPromise } from './init';
import { VideoDownloadTask } from './video-download';

const DOWNLOAD_STARTED_EVENT = 'DOWNLOAD_STARTED';

export class DownloadService {
    private readonly eventEmitter: EventEmitter = new EventEmitter();
    private readonly downloadTasks: { [url: string]: VideoDownloadTask } = {};

    public async queueDownload(url: string, outputDirectory: string): Promise<void> {
        if (this.downloadTasks[url]) {
            toast.warn(`Already downloading ${url}`);
            return;
        }

        this.downloadTasks[url] = new VideoDownloadTask(url, outputDirectory);

        this.eventEmitter.emit(DOWNLOAD_STARTED_EVENT, this.downloadTasks[url]);
        await initPromise;
        await this.downloadTasks[url].download();

        delete this.downloadTasks[url];
    }

    public addDownloadStartedListener(fn: (downloadTask: VideoDownloadTask) => void): void {
        this.eventEmitter.addListener(DOWNLOAD_STARTED_EVENT, fn);
    }
}
