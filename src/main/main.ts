import { app, BrowserWindow } from 'electron';
import path from 'path';

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
