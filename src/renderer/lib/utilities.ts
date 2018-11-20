import fs from 'fs';
import path from 'path';
import { toast } from 'react-toastify';
import request from 'request';
import { promisify } from 'util';

export function downloadString(url: string): Promise<string> {
    return download(url);
}

export function downloadJson(url: string): Promise<any> {
    return download(url, { json: true });
}

export function downloadBuffer(url: string): Promise<Buffer> {
    return download(url, { encoding: null });
}

export async function downloadFile(url: string, pathPrefix: string): Promise<string> {
    const buffer = await downloadBuffer(url);
    const filename = path.join(pathPrefix, extractFilename(url));
    await promisify(fs.writeFile)(filename, buffer);
    return filename;
}

/**
 * Port of youtube-dl sanitize_filename function. See:
 * https://github.com/rg3/youtube-dl/blob/25d110be30b92f785617140b0617a73d8eec5f7b/youtube_dl/utils.py#L482
 * @param filename Filename to sanitize.
 */
export function sanitizeFilename(filename: string): string {
    let result = filename;
    result = result.replace(/[0-9]+(?::[0-9]+)+/, (match) => match.replace(/:/g, '_'));
    result = result.replace(/./g, (char) => {
        const charCode = char.charCodeAt(0);
        if (char === '?' || charCode < 32 || charCode === 127) {
            return '';
        }
        if (char === '"') {
            return "'";
        }
        if (char === ':') {
            return ' -';
        }
        if ('\\/|*<>'.includes(char)) {
            return '_';
        }
        return char;
    });
    result = result.replace(/_+/g, '_');
    if (result.startsWith('_')) {
        result = result.slice(1);
    }
    if (result.endsWith('_')) {
        result = result.slice(0, -1);
    }
    if (result.startsWith('-')) {
        result = '_' + result.slice(1);
    }
    result = result.replace(/^\.+/, '');

    return result || '_';
}

export function existsAsync(file: string): Promise<boolean> {
    return new Promise((resolve) => {
        fs.access(file, (err) => resolve(!err));
    });
}

export function extractFilename(text: string): string {
    const result = /[^/]*$/.exec(text);
    return result ? result[0] : text;
}

export function isValidUrl(url: string): boolean {
    try {
        new URL(url); // tslint:disable-line:no-unused-expression
        return true;
    } catch {
        return false;
    }
}

export function defaultCatch(error: Error): void {
    toast.error(error.message);
}

function download(url: string, options?: request.CoreOptions): Promise<any> {
    options = {
        headers: { 'user-agent': 'request' },
        timeout: 5000,
        ...options,
    };
    return new Promise((resolve, reject) => {
        request(url, options, (err, response, body) => {
            if (err) {
                reject(err);
            } else if (response.statusCode !== 200) {
                reject(new Error(`Request failed, status code: ${response.statusCode}`));
            } else {
                resolve(body);
            }
        });
    });
}
