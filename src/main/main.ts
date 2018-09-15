import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import url from 'url';
import { downloadVideo } from './lib/download-video';

const isDevelopment = process.env.NODE_ENV !== 'production';

let mainWindow: BrowserWindow | undefined;

app.on('ready', () => {
    mainWindow = new BrowserWindow();
    if (isDevelopment) {
        mainWindow.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
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

let i = 0;

ipcMain.addListener('test-event', (event: Electron.Event, videoUrl: string) => {
    console.log(`${i++} ${videoUrl}`);
    downloadVideo(videoUrl).catch(console.error);
});
