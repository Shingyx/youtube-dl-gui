import fs from 'fs';
import fetch, { Response } from 'node-fetch';
import path from 'path';
import { toast } from 'react-toastify';

export async function downloadString(url: string): Promise<string> {
    const response = await wrappedFetch(url);
    return response.text();
}

export async function downloadJson(url: string): Promise<any> {
    const response = await wrappedFetch(url);
    return response.json();
}

export async function downloadBuffer(url: string): Promise<Buffer> {
    const response = await wrappedFetch(url);
    return response.buffer();
}

export async function downloadFile(url: string, pathPrefix: string): Promise<string> {
    const buffer = await downloadBuffer(url);
    const filename = path.join(pathPrefix, extractFilename(url));
    await fs.promises.writeFile(filename, buffer);
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

export async function existsAsync(file: string): Promise<boolean> {
    try {
        await fs.promises.access(file);
        return true;
    } catch {
        return false;
    }
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

async function wrappedFetch(url: string): Promise<Response> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request failed, status code: ${response.status}`);
    }
    return response;
}
