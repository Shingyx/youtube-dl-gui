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
