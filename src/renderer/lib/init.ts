import { ipcRenderer } from 'electron';
import fs from 'fs';
import { toast } from 'react-toastify';
import { promisify } from 'util';
import { IpcMessage } from '../../common/ipc-message';
import { loadConfig, promptOutputDirectory } from './config';
import { binariesPath } from './constants';
import { downloadFfmpeg, downloadYouTubeDl } from './dependency-updaters';
import { defaultCatch, existsAsync } from './utilities';

export const initPromise = init().catch(() => {
    toast.error('Failed to set up application');
});

ipcRenderer.on(IpcMessage.SetOutputDirectory, () => {
    promptOutputDirectory({ missing: false }).catch(defaultCatch);
});
ipcRenderer.on(IpcMessage.ShowInfoMessage, (event: any, message: string) => {
    toast(message);
});
ipcRenderer.on(IpcMessage.ShowErrorMessage, (event: any, message: string) => {
    toast.error(message);
});

async function init(): Promise<void> {
    if (!(await existsAsync(binariesPath))) {
        await promisify(fs.mkdir)(binariesPath);
    }
    await Promise.all([downloadYouTubeDl(), downloadFfmpeg(), loadConfig()]);
}
