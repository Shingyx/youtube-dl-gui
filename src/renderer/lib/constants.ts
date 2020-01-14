import { remote } from 'electron';
import path from 'path';

const userDataPath = remote.app.getPath('userData');

export const youTubeDlName = process.platform === 'win32' ? 'youtube-dl.exe' : 'youtube-dl';

export const binariesPath = path.join(userDataPath, 'bin');
export const configPath = path.join(userDataPath, 'config.json');
export const youTubeDlPath = path.join(binariesPath, youTubeDlName);
export const ffmpegPath = path.join(binariesPath, 'ffmpeg.exe');
