import { remote } from 'electron';
import fs from 'fs';
import { toast } from 'react-toastify';
import { promisify } from 'util';

import { configPath } from './constants';

interface IConfig {
    outputDirectory: string | undefined;
}

const config: IConfig = {
    outputDirectory: undefined,
};

export function getOutputDirectory(): string | undefined {
    return config.outputDirectory;
}

export async function promptOutputDirectory({ missing }: { missing: boolean }): Promise<void> {
    if (missing) {
        await new Promise((resolve) => {
            remote.dialog.showMessageBox(
                remote.getCurrentWindow(),
                {
                    type: 'info',
                    message: 'Unknown output directory. Press OK to configure output directory.',
                    buttons: ['OK'],
                },
                () => resolve(),
            );
        });
    }
    const directory = await new Promise<string | undefined>((resolve) => {
        remote.dialog.showOpenDialog(
            remote.getCurrentWindow(),
            {
                title: 'Output Directory',
                properties: ['openDirectory'],
            },
            (filePaths) => resolve(filePaths ? filePaths[0] : undefined),
        );
    });
    if (directory) {
        config.outputDirectory = directory;
        await saveConfig();
        toast(`Updated output directory to "${directory}"`);
    }
}

export async function loadConfig(): Promise<void> {
    try {
        const file = await promisify(fs.readFile)(configPath, 'utf8');
        const configJson = JSON.parse(file);
        if (typeof configJson.outputDirectory === 'string') {
            config.outputDirectory = configJson.outputDirectory;
        }
    } catch {
        // noop
    }
}

async function saveConfig(): Promise<void> {
    const configStr = JSON.stringify(config, undefined, 2);
    await promisify(fs.writeFile)(configPath, configStr);
}
