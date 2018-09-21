import { app, BrowserWindow } from 'electron';
import path from 'path';
import url from 'url';

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
