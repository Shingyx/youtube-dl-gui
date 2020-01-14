import { ipcRenderer } from 'electron';
import fs from 'fs';
import { toast } from 'react-toastify';
import { IpcMessage } from '../../common/ipc-message';
import { loadConfig, promptOutputDirectory } from './config';
import { binariesPath } from './constants';
import { downloadFfmpeg, downloadYouTubeDl } from './dependency-updaters';
import { defaultCatch, existsAsync } from './utilities';

export const initPromise = init().catch((e) => {
    toast.error(`Failed to set up application - ${e.message}`);
});

ipcRenderer.on(IpcMessage.SetOutputDirectory, () => {
    promptOutputDirectory({ missing: false }).catch(defaultCatch);
});
ipcRenderer.on(IpcMessage.ShowMessage, (event: any, message: string) => {
    toast(message);
});
ipcRenderer.on(IpcMessage.ShowInfoMessage, (event: any, message: string) => {
    toast.info(message);
});
ipcRenderer.on(IpcMessage.ShowErrorMessage, (event: any, message: string) => {
    toast.error(message);
});

async function init(): Promise<void> {
    if (!(await existsAsync(binariesPath))) {
        await fs.promises.mkdir(binariesPath);
    }
    await Promise.all([downloadYouTubeDl(), downloadFfmpeg(), loadConfig()]);
}
