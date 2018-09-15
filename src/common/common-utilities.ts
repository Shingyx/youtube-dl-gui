import { URL } from 'url';

export function isValidUrl(url: string): boolean {
    try {
        new URL(url); // tslint:disable-line:no-unused-expression
        return true;
    } catch {
        return false;
    }
}
