import { isValidUrl, sanitizeFilename } from '../../../src/renderer/lib/utilities';

describe('#sanitizeFilename', () => {
    runTest('abc', 'abc');
    runTest('abc_d-e', 'abc_d-e');
    runTest('123', '123');
    runTest('abc/de', 'abc_de');
    runTest('abc/de///', 'abc_de');
    runTest('abc/<>\\*|de', 'abc_de');
    runTest('xxx/<>\\*|', 'xxx');
    runTest('yes? no', 'yes no');
    runTest('this: that', 'this - that');
    runTest('AT&T', 'AT&T');
    runTest('ä', 'ä');
    runTest('кириллица', 'кириллица');
    runTest('New World record at 0:12:34', 'New World record at 0_12_34');
    runTest('--gasdgf', '_-gasdgf');
    runTest('.gasdgf', 'gasdgf');
    runTest('', '_');
    runTest('test.mp4', 'test.mp4');

    function runTest(input: string, expected: string): void {
        test(`"${input}" sanitized is "${expected}"`, () => {
            const result = sanitizeFilename(input);
            expect(result).toBe(expected);
        });
    }
});

describe('#isValidUrl', () => {
    test('https://www.youtube.com/ is valid', () => {
        expect(isValidUrl('https://www.youtube.com/')).toBe(true);
    });

    test('https://www.youtube.com/watch?v=KD9sMqp7bdE is valid', () => {
        expect(isValidUrl('https://www.youtube.com/watch?v=KD9sMqp7bdE')).toBe(true);
    });

    test('https://youtu.be/KD9sMqp7bdE is valid', () => {
        expect(isValidUrl('https://youtu.be/KD9sMqp7bdE')).toBe(true);
    });

    test('www.youtube.com/watch?v=KD9sMqp7bdE is invalid', () => {
        expect(isValidUrl('www.youtube.com/watch?v=KD9sMqp7bdE')).toBe(false);
    });

    test('"hello world" is invalid', () => {
        expect(isValidUrl('hello world')).toBe(false);
    });

    test('an empty string is invalid', () => {
        expect(isValidUrl('')).toBe(false);
    });
});
