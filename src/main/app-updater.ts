import { autoUpdater } from 'electron-updater';
import { IpcMessage } from '../common/ipc-message';

export class AppUpdater {
    constructor(
        private readonly sendMessageToWindow: (ipcMessage: IpcMessage, ...args: any[]) => void,
        private readonly isDevelopment: boolean,
    ) {}

    public async checkForUpdates(notifyNoUpdates: boolean): Promise<void> {
        if (this.isDevelopment) {
            this.sendMessageToWindow(IpcMessage.ShowMessage, 'Skipping check in development build');
            return;
        }
        try {
            const { downloadPromise, updateInfo } = await autoUpdater.checkForUpdates();
            if (downloadPromise) {
                await downloadPromise;
                this.sendMessageToWindow(
                    IpcMessage.ShowInfoMessage,
                    `Restart application to update to version ${updateInfo.version}`,
                );
            } else if (notifyNoUpdates) {
                this.sendMessageToWindow(IpcMessage.ShowMessage, 'No update available');
            }
        } catch (e) {
            this.sendMessageToWindow(IpcMessage.ShowErrorMessage, e.message);
        }
    }
}
