import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { IpcMessages } from '../common/ipc-messages';

const isDevelopment = process.env.NODE_ENV !== 'production';

let mainWindow: BrowserWindow | undefined;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        title: 'YouTube DL GUI',
    });
    if (isDevelopment) {
        mainWindow.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`);
    }
    mainWindow.on('closed', () => {
        mainWindow = undefined;
    });
});

app.on('window-all-closed', () => {
    app.quit();
});

const menu = Menu.buildFromTemplate([
    {
        label: 'File',
        submenu: [
            {
                label: 'Set output directory',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send(IpcMessages.SetOutputDirectory);
                    }
                },
            },
            {
                label: 'Exit',
                click: () => {
                    app.quit();
                },
            },
        ],
    },
]);
Menu.setApplicationMenu(menu);
