import * as remote from '@electron/remote';
import fs from 'fs';
import { toast } from 'react-toastify';
import { promisify } from 'util';

import { configPath, remoteConfigUrl } from './constants';
import { downloadString, existsAsync } from './utilities';

export interface IRemoteConfig {
  ffmpegUrl: string;
}

interface IConfig {
  outputDirectory: string | undefined;
  downloadedFfmpegUrl: string | undefined;
  remoteConfig: {
    value: IRemoteConfig | undefined;
    lastCheckTime: number | undefined;
  };
}

const config: IConfig = {
  outputDirectory: undefined,
  downloadedFfmpegUrl: undefined,
  remoteConfig: {
    value: undefined,
    lastCheckTime: undefined,
  },
};

const REMOTE_CONFIG_UPDATE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

export function getOutputDirectory(): string | undefined {
  return config.outputDirectory;
}

export async function promptOutputDirectory({ missing }: { missing: boolean }): Promise<void> {
  if (missing) {
    await remote.dialog.showMessageBox(remote.getCurrentWindow(), {
      type: 'info',
      message: 'Unknown output directory. Press OK to configure output directory.',
      buttons: ['OK'],
    });
  }
  const { filePaths } = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
    title: 'Output Directory',
    properties: ['openDirectory'],
  });
  const directory = filePaths?.[0];
  if (directory) {
    config.outputDirectory = directory;
    await saveConfig();
    toast(`Updated output directory to "${directory}"`);
  }
}

export function getDownloadedFfmpegUrl(): string | undefined {
  return config.downloadedFfmpegUrl;
}

export function setDownloadedFfmpegUrl(ffmpegUrl: string): void {
  config.downloadedFfmpegUrl = ffmpegUrl;
  saveConfig();
}

export function getRemoteFfmpegUrl(): string | undefined {
  return config.remoteConfig.value?.ffmpegUrl;
}

export async function loadConfig(): Promise<void> {
  try {
    if (await existsAsync(configPath)) {
      const file = await promisify(fs.readFile)(configPath, 'utf8');
      const configJson = JSON.parse(file);
      if (typeof configJson.outputDirectory === 'string') {
        config.outputDirectory = configJson.outputDirectory;
      }
      if (typeof configJson.downloadedFfmpegUrl === 'string') {
        config.downloadedFfmpegUrl = configJson.downloadedFfmpegUrl;
      }
      if (isValidRemoteConfig(configJson.remoteConfig?.value)) {
        config.remoteConfig.value = configJson.remoteConfig.value;
      }
      if (typeof configJson.remoteConfig?.lastCheckTime === 'number') {
        config.remoteConfig.lastCheckTime = configJson.remoteConfig.lastCheckTime;
      }
    }

    // refresh if needed
    if (
      !config.remoteConfig.lastCheckTime ||
      Date.now() - config.remoteConfig.lastCheckTime > REMOTE_CONFIG_UPDATE_INTERVAL_MS
    ) {
      const remoteConfig = await refreshRemoteConfig();
      if (remoteConfig) {
        config.remoteConfig.value = remoteConfig;
        config.remoteConfig.lastCheckTime = Date.now();
        saveConfig();
      }
    }
  } catch {
    // noop
  }
}

async function saveConfig(): Promise<void> {
  const configStr = JSON.stringify(config, undefined, 2);
  await promisify(fs.writeFile)(configPath, configStr);
}

async function refreshRemoteConfig(): Promise<IRemoteConfig | undefined> {
  try {
    const response = await downloadString(remoteConfigUrl);
    const remoteConfig = JSON.parse(response);
    if (isValidRemoteConfig(remoteConfig)) {
      return remoteConfig;
    }
  } catch {
    // noop
  }
}

function isValidRemoteConfig(remoteConfig: any): remoteConfig is IRemoteConfig {
  const ffmpegUrl = remoteConfig?.ffmpegUrl;
  return (
    typeof ffmpegUrl === 'string' &&
    ffmpegUrl.startsWith('https://github.com/yt-dlp/FFmpeg-Builds/releases/download/') &&
    ffmpegUrl.endsWith('.zip')
  );
}
