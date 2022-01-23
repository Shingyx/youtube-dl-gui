import * as remote from '@electron/remote';
import path from 'path';

const userDataPath = remote.app.getPath('userData');

export const binariesPath = path.join(userDataPath, 'bin');
export const configPath = path.join(userDataPath, 'config.json');
export const ytDlpPath = path.join(binariesPath, 'yt-dlp.exe');
export const ffmpegPath = path.join(binariesPath, 'ffmpeg.exe');
