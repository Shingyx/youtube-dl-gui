import fs from 'fs';
import path from 'path';
import { toast } from 'react-toastify';
import yauzl from 'yauzl';
import { downloadYtDlp as ytDlpDl } from 'yt-dlp-dl';

import { binariesPath, ffmpegPath } from './constants';
import { downloadBuffer, existsAsync, extractFilename } from './utilities';

export async function downloadYtDlp(): Promise<void> {
    return ytDlpDl(binariesPath, {
        info: toast,
        error: toast.error,
    });
}

export async function downloadFfmpeg(): Promise<void> {
    if (await existsAsync(ffmpegPath)) {
        return;
    }

    toast('Downloading ffmpeg...');

    const zipBuffer = await downloadBuffer(
        'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-n4.4-latest-win64-gpl-shared-4.4.zip',
    );

    await new Promise((resolve, reject) => {
        yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipFile) => {
            if (err || !zipFile) {
                return reject(err);
            }
            const entryRegex = /\/bin\/(.+\.dll|(ffmpeg|ffprobe)\.exe)$/;
            zipFile.readEntry();
            zipFile
                .on('error', reject)
                .on('entry', (entry: yauzl.Entry) => {
                    if (entryRegex.test(entry.fileName)) {
                        zipFile.openReadStream(entry, (err2, readStream) => {
                            if (err2 || !readStream) {
                                return reject(err2);
                            }
                            const targetFile = path.join(
                                binariesPath,
                                extractFilename(entry.fileName),
                            );
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
