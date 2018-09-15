import fs from 'fs';
import yauzl from 'yauzl';
import { isValidUrl } from '../../common/common-utilities';
import { downloadBuffer, downloadFile, downloadJson, extractFilename } from './download-utilities';

export async function downloadLibrariesIfNotExists(): Promise<void> {
    await Promise.all([downloadYouTubeDlIfNotExists(), downloadFfmpegIfNotExists()]);
}

export async function downloadYouTubeDlIfNotExists(): Promise<void> {
    if (!(await existsAsync('./bin/youtube-dl.exe'))) {
        console.log('Downloading youtube-dl...');
        await downloadYouTubeDl();
        console.log('youtube-dl download complete');
    }
}

export async function downloadFfmpegIfNotExists(): Promise<void> {
    if (!(await existsAsync('./bin/ffmpeg.exe'))) {
        console.log('Downloading ffmpeg...');
        await downloadFfmpeg();
        console.log('ffmpeg download complete');
    }
}

export async function downloadYouTubeDl(): Promise<void> {
    const releaseJson = await downloadJson(
        'https://api.github.com/repos/rg3/youtube-dl/releases/latest',
    );

    const asset =
        releaseJson &&
        releaseJson.assets &&
        releaseJson.find((a: any) => a.name === 'youtube-dl.exe');
    const youTubeDlUrl = asset && asset.browser_download_url;
    if (!youTubeDlUrl || isValidUrl(youTubeDlUrl)) {
        throw new Error('Could not read youtube-dl.exe download url');
    }

    await downloadFile(youTubeDlUrl, './bin/');
}

export async function downloadFfmpeg(): Promise<void> {
    const zipBuffer = await downloadBuffer(
        'https://ffmpeg.zeranoe.com/builds/win64/shared/ffmpeg-4.0.2-win64-shared.zip',
    );

    await new Promise((resolve, reject) => {
        yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipFile) => {
            if (err || !zipFile) {
                return reject(err);
            }
            zipFile.readEntry();
            zipFile
                .on('error', reject)
                .on('entry', (entry: yauzl.Entry) => {
                    if (/\/bin\/(.+\.dll|ffmpeg\.exe)$/.test(entry.fileName)) {
                        zipFile.openReadStream(entry, (err2, readStream) => {
                            if (err2 || !readStream) {
                                return reject(err2);
                            }
                            const targetFile = `./bin/${extractFilename(entry.fileName)}`;
                            const fileStream = fs.createWriteStream(targetFile);
                            readStream
                                .on('error', (e) => fileStream.destroy(e))
                                .pipe(fileStream)
                                .on('error', (e) => fs.unlink(targetFile, (e2) => reject(e2 || e)))
                                .on('close', () => zipFile.readEntry());
                        });
                    } else {
                        zipFile.readEntry();
                    }
                })
                .on('end', resolve);
        });
    });
}

function existsAsync(file: string): Promise<boolean> {
    return new Promise((resolve) => {
        fs.access(file, fs.constants.F_OK, (err) => resolve(!err));
    });
}
