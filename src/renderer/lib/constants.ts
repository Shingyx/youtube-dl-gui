import { remote } from 'electron';
import path from 'path';

const userDataPath = remote.app.getPath('userData');

export const binariesPath = path.join(userDataPath, 'bin');
export const configPath = path.join(userDataPath, 'config.json');
export const youTubeDlPath = path.join(binariesPath, 'youtube-dl.exe');
export const ffmpegPath = path.join(binariesPath, 'ffmpeg.exe');
