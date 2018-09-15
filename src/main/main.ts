import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import url from 'url';
import { Events } from '../common/events';
import { downloadVideo } from './lib/download-video';

const isDevelopment = process.env.NODE_ENV !== 'production';

let mainWindow: BrowserWindow | undefined;

app.on('ready', () => {
    mainWindow = new BrowserWindow();
    if (isDevelopment) {
        mainWindow.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadURL(
            url.format({
                pathname: path.join(__dirname, 'index.html'),
                protocol: 'file',
                slashes: true,
            }),
        );
    }
    mainWindow.on('closed', () => {
        mainWindow = undefined;
    });
});

ipcMain.addListener(Events.DOWNLOAD_VIDEO, (event: Electron.Event, videoUrl: string) => {
    downloadVideo(videoUrl).catch(console.error);
});
