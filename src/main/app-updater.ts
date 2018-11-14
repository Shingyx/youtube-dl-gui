import { autoUpdater } from 'electron-updater';
import { IpcMessage } from '../common/ipc-message';

export class AppUpdater {
    private updatesPromise: Promise<void> | undefined;

    constructor(
        private readonly sendMessageToWindow: (ipcMessage: IpcMessage, ...args: any[]) => void,
        private readonly isDevelopment: boolean,
    ) {}

    public checkForUpdates(notifyNoUpdates: boolean): void {
        if (!this.updatesPromise) {
            this.updatesPromise = this.doCheckForUpdates(notifyNoUpdates).finally(() => {
                this.updatesPromise = undefined;
            });
        }
    }

    private async doCheckForUpdates(notifyNoUpdates: boolean): Promise<void> {
        if (this.isDevelopment) {
            this.sendMessageToWindow(
                IpcMessage.ShowInfoMessage,
                'Skipping check in development build',
            );
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
            }
            if (notifyNoUpdates) {
                this.sendMessageToWindow(IpcMessage.ShowInfoMessage, 'No update available');
            }
        } catch (e) {
            this.sendMessageToWindow(IpcMessage.ShowErrorMessage, e.message);
        }
    }
}
