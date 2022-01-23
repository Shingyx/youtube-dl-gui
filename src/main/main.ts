import * as remoteMain from '@electron/remote/main';
import { app, BrowserWindow, Menu, nativeTheme } from 'electron';
import windowState from 'electron-window-state';
import path from 'path';

import { IpcMessage } from '../common/ipc-message';
import { AppUpdater } from './app-updater';

const isDevelopment = process.env.NODE_ENV !== 'production';

const appUpdater = new AppUpdater(sendMessageToWindow, isDevelopment);

let mainWindow: BrowserWindow | undefined;

app.on('ready', () => {
  remoteMain.initialize();

  const mainWindowState = windowState({
    defaultWidth: 800,
    defaultHeight: 600,
  });

  nativeTheme.themeSource = 'light';
  mainWindow = new BrowserWindow({
    title: 'YouTube DL GUI',
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  remoteMain.enable(mainWindow.webContents);

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
          id: 'check-updates',
          label: 'Check for updates',
          enabled: false,
          click: (menuItem) => {
            menuItem.enabled = false;
            void appUpdater.checkForUpdates(true).finally(() => {
              menuItem.enabled = true;
            });
          },
        },
        {
          label: 'Exit',
          click: () => app.quit(),
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);

  void appUpdater.checkForUpdates(false).finally(() => {
    const checkUpdatesMenuItem = menu.getMenuItemById('check-updates');
    if (checkUpdatesMenuItem) {
      checkUpdatesMenuItem.enabled = true;
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

function sendMessageToWindow(ipcMessage: IpcMessage, ...args: any[]): void {
  if (mainWindow) {
    mainWindow.webContents.send(ipcMessage, ...args);
  }
}
