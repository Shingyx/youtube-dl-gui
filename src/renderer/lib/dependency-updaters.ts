import fs from 'fs';
import path from 'path';
import { toast } from 'react-toastify';
import yauzl from 'yauzl';
import { downloadYtDlp as ytDlpDl } from 'yt-dlp-dl';

import { binariesPath, ffmpegPath } from './constants';
import { loadRemoteConfig } from './remote-config';
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
  if (await existsAsync(ffmpegPath)) {
    return;
  }

  toast('Downloading ffmpeg...');

  const remoteConfig = await loadRemoteConfig();
  if (!remoteConfig) {
    toast.error('Error downloading ffmpeg');
    return;
  }

  const zipBuffer = await downloadBuffer(remoteConfig.ffmpegUrl);

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

  toast('ffmpeg download complete');
}
