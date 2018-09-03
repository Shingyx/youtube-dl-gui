import fs from 'fs';
import request from 'request';
import { URL } from 'url';
import yauzl from 'yauzl';

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

    let youTubeDlUrl: string;
    try {
        youTubeDlUrl = releaseJson.assets.find((a: any) => {
            return a.name === 'youtube-dl.exe';
        }).browser_download_url;
        new URL(youTubeDlUrl); // tslint:disable-line:no-unused-expression
    } catch {
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
                            readStream
                                .on('error', reject)
                                .on('end', () => zipFile.readEntry())
                                .pipe(fs.createWriteStream(targetFile));
                        });
                    } else {
                        zipFile.readEntry();
                    }
                })
                .on('end', resolve);
        });
    });
}

function downloadJson(url: string): Promise<any> {
    return download(url, { json: true });
}

function downloadBuffer(url: string): Promise<Buffer> {
    return download(url, { encoding: null });
}

function download(url: string, options: request.CoreOptions): Promise<any> {
    return new Promise((resolve, reject) => {
        request.get(
            {
                url,
                headers: { 'user-agent': 'request' },
                timeout: 5000,
                ...options,
            },
            (err, response, body) => {
                if (err) {
                    reject(err);
                } else if (response.statusCode !== 200) {
                    reject(new Error(`Request failed, status code: ${response.statusCode}`));
                } else {
                    resolve(body);
                }
            },
        );
    });
}

function downloadFile(url: string, pathPrefix: string): Promise<string> {
    return new Promise((resolve, reject) => {
        request
            .get({
                url,
                headers: { 'user-agent': 'request' },
                timeout: 5000,
            })
            .on('error', reject)
            .on('response', (response) => {
                if (response.statusCode !== 200) {
                    return reject(new Error(`Request failed, status code: ${response.statusCode}`));
                }
                const filename = pathPrefix + extractFilename(url);
                response.pipe(fs.createWriteStream(filename).on('close', () => resolve(filename)));
            });
    });
}

function extractFilename(text: string): string {
    const result = /[^/]*$/.exec(text);
    return result ? result[0] : text;
}

function existsAsync(file: string): Promise<boolean> {
    return new Promise((resolve) => {
        fs.access(file, fs.constants.F_OK, (err) => resolve(!err));
    });
}
