import { remoteConfigUrl } from './constants';
import { downloadString } from './utilities';

export interface IRemoteConfig {
  ffmpegUrl: string;
}

export async function loadRemoteConfig(): Promise<IRemoteConfig | undefined> {
  try {
    const response = await downloadString(remoteConfigUrl);
    const remoteConfig = JSON.parse(response) as IRemoteConfig;

    // basic validation
    const ffmpegUrl = remoteConfig.ffmpegUrl;
    if (
      typeof ffmpegUrl === 'string' &&
      ffmpegUrl.startsWith('https://github.com/yt-dlp/FFmpeg-Builds/releases/download/') &&
      ffmpegUrl.endsWith('.zip')
    ) {
      return remoteConfig;
    }
  } catch {
    // noop
  }
}
