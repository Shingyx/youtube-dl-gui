import fs from 'fs';
import path from 'path';
import { toast } from 'react-toastify';
import { promisify } from 'util';
import yauzl from 'yauzl';
import { downloadYtDlp as ytDlpDl } from 'yt-dlp-dl';

import { getDownloadedFfmpegUrl, getRemoteFfmpegUrl, setDownloadedFfmpegUrl } from './config';
import { binariesPath, ffmpegPath } from './constants';
import { downloadBuffer, existsAsync, extractFilename } from './utilities';

export async function downloadYtDlp(): Promise<void> {
  await ytDlpDl(binariesPath, {
    info(message) {
      if (!message.includes('already up to date')) {
        toast(message);
      }
    },
    error(message) {
      toast.error(message);
    },
  });
}

export async function downloadFfmpeg(): Promise<void> {
  const ffmpegUrl = getRemoteFfmpegUrl();
  const existingFfmpegUrl = getDownloadedFfmpegUrl();
  if ((await existsAsync(ffmpegPath)) && (ffmpegUrl === existingFfmpegUrl || !ffmpegUrl)) {
    // no update required (or possible)
    return;
  }

  if (!ffmpegUrl) {
    toast.error('Error downloading ffmpeg');
    return;
  }

  toast('Downloading ffmpeg...');

  // clean up existing install
  const existingFilesRegex = /(.+\.dll|(ffmpeg|ffprobe)\.exe)$/;
  const files = await promisify(fs.readdir)(binariesPath);
  for (const file of files) {
    if (existingFilesRegex.test(file)) {
      await promisify(fs.unlink)(path.join(binariesPath, file));
    }
  }

  // download and unzip
  const zipBuffer = await downloadBuffer(ffmpegUrl);
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
              const targetFile = path.join(binariesPath, extractFilename(entry.fileName));
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

  setDownloadedFfmpegUrl(ffmpegUrl);

  toast('ffmpeg download complete');
}
