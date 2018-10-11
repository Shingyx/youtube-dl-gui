import fs from 'fs';
import request from 'request';
import { promisify } from 'util';

const wrappedRequest = request.defaults({
    headers: { 'user-agent': 'request' },
    timeout: 5000,
});

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
    const filename = pathPrefix + extractFilename(url);
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

function download(url: string, options?: request.CoreOptions): Promise<any> {
    return new Promise((resolve, reject) => {
        wrappedRequest(url, options, (err, response, body) => {
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
