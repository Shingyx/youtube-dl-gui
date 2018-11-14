import { app, BrowserWindow, Menu } from 'electron';
import windowState from 'electron-window-state';
import path from 'path';
import { IpcMessage } from '../common/ipc-message';
import { AppUpdater } from './app-updater';

const isDevelopment = process.env.NODE_ENV !== 'production';

const appUpdater = new AppUpdater(sendMessageToWindow, isDevelopment);

let mainWindow: BrowserWindow | undefined;

app.on('ready', () => {
    const mainWindowState = windowState({
        defaultWidth: 800,
        defaultHeight: 600,
    });

    mainWindow = new BrowserWindow({
        title: 'YouTube DL GUI',
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
    });

    mainWindowState.manage(mainWindow);

    if (isDevelopment) {
        mainWindow.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`);
    }
    mainWindow.on('closed', () => {
        mainWindow = undefined;
    });

    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'Set output directory',
                    click: () => sendMessageToWindow(IpcMessage.SetOutputDirectory),
                },
                {
                    label: 'Check for updates',
                    click: () => appUpdater.checkForUpdates(true),
                },
                {
                    label: 'Exit',
                    click: () => app.quit(),
                },
            ],
        },
    ]);
    Menu.setApplicationMenu(menu);

    appUpdater.checkForUpdates(false);
});

app.on('window-all-closed', () => {
    app.quit();
});

function sendMessageToWindow(ipcMessage: IpcMessage, ...args: any[]): void {
    if (mainWindow) {
        mainWindow.webContents.send(ipcMessage, ...args);
    }
}
