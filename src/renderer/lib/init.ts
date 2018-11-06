import fs from 'fs';
import { toast } from 'react-toastify';
import { promisify } from 'util';
import { loadConfig } from './config';
import { downloadFfmpeg, downloadYouTubeDl } from './dependency-updaters';
import { existsAsync } from './utilities';

export const initPromise = init().catch(() => {
    toast.error('Failed to set up application');
});

async function init(): Promise<void> {
    if (!(await existsAsync('./bin/'))) {
        await promisify(fs.mkdir)('./bin/');
    }
    await Promise.all([downloadYouTubeDl(), downloadFfmpeg(), loadConfig()]);
}
