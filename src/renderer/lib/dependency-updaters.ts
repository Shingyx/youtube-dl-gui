import { execFile } from 'child_process';
import fs from 'fs';
import { toast } from 'react-toastify';
import { promisify } from 'util';
import yauzl from 'yauzl';
import {
    downloadBuffer,
    downloadFile,
    downloadJson,
    existsAsync,
    extractFilename,
} from './utilities';

export const initPromise = downloadDependencies().catch(() => {
    toast.error('Failed to set up application');
});

async function downloadDependencies(): Promise<void> {
    if (!(await existsAsync('./bin/'))) {
        await promisify(fs.mkdir)('./bin/');
    }
    await Promise.all([downloadYouTubeDl(), downloadFfmpeg()]);
}

async function downloadYouTubeDl(): Promise<void> {
    const releaseJsonPromise = downloadJson(
        'https://api.github.com/repos/rg3/youtube-dl/releases/latest',
    );

    if (await existsAsync('./bin/youtube-dl.exe')) {
        let installedVersion: string | undefined;
        try {
            const { stdout } = await promisify(execFile)('./bin/youtube-dl.exe', ['--version']);
            installedVersion = stdout.trim();
        } catch {
            toast.error('Failed to read installed youtube-dl version');
        }
        if (installedVersion && installedVersion === (await releaseJsonPromise).tag_name) {
            return; // youtube-dl up to date
        }
        toast('Updating youtube-dl...');
    } else {
        toast('Downloading youtube-dl...');
    }

    const youTubeDlUrl = (await releaseJsonPromise).assets.find(
        (a: any) => a.name === 'youtube-dl.exe',
    ).browser_download_url;

    await downloadFile(youTubeDlUrl, './bin/');

    toast('youtube-dl download complete');
}

async function downloadFfmpeg(): Promise<void> {
    if (await existsAsync('./bin/ffmpeg.exe')) {
        return;
    }

    toast('Downloading ffmpeg...');

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

    toast('ffmpeg download complete');
}
