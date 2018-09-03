import fs from 'fs';
import { URL } from 'url';
import { downloadFfmpegIfNotExists, downloadYouTubeDlIfNotExists } from './lib-updaters';
import { VideoDownloadTask } from './video-download-task';

async function main(): Promise<void> {
    const url = process.argv[2];

    if (!url) {
        console.log('URL not provided');
        process.exit(0);
    }

    try {
        new URL(url); // tslint:disable-line:no-unused-expression
    } catch {
        throw new Error(`"${url}" is not a valid URL`);
    }

    if (!fs.existsSync('./bin')) {
        fs.mkdirSync('./bin');
    }

    await Promise.all([downloadYouTubeDlIfNotExists(), downloadFfmpegIfNotExists()]);

    const videoDownloadTask = new VideoDownloadTask(url);
    console.log(`Downloading "${url}"...`);
    await videoDownloadTask.download();
    console.log(videoDownloadTask.getErrorMessage() || 'Download complete!');
}

main().catch((err) => {
    console.error(err.stack);
    process.exit(1);
});
