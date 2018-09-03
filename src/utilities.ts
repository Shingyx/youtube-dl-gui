import fs from 'fs';
import request from 'request';

export function downloadString(url: string): Promise<string> {
    return download(url);
}

export function downloadJson(url: string): Promise<any> {
    return download(url, { json: true });
}

export function downloadBuffer(url: string): Promise<Buffer> {
    return download(url, { encoding: null });
}

export function downloadFile(url: string, pathPrefix: string): Promise<string> {
    return new Promise((resolve, reject) => {
        request
            .get({
                url,
                headers: { 'user-agent': 'request' },
                timeout: 5000,
            })
            .on('error', reject)
            .on('response', (response) => {
                if (response.statusCode !== 200) {
                    return reject(new Error(`Request failed, status code: ${response.statusCode}`));
                }
                const filename = pathPrefix + extractFilename(url);
                response.pipe(fs.createWriteStream(filename).on('close', () => resolve(filename)));
            });
    });
}

export function extractFilename(text: string): string {
    const result = /[^/]*$/.exec(text);
    return result ? result[0] : text;
}

function download(url: string, options?: request.CoreOptions): Promise<any> {
    return new Promise((resolve, reject) => {
        request.get(
            {
                url,
                headers: { 'user-agent': 'request' },
                timeout: 5000,
                ...options,
            },
            (err, response, body) => {
                if (err) {
                    reject(err);
                } else if (response.statusCode !== 200) {
                    reject(new Error(`Request failed, status code: ${response.statusCode}`));
                } else {
                    resolve(body);
                }
            },
        );
    });
}
