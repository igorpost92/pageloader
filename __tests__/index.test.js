import path from 'path';
import nock from 'nock';
import { promises as fs } from 'fs';

import { makeName, makeNameWithExt, mkdtemp } from '../src/utils';
import download from '../src/';

describe('Make name', () => {
  it('set 1', () => {
    const address = 'https://-hexlet-.io/courses/';
    const expected = 'hexlet-io-courses';
    expect(makeName(address)).toBe(expected);
  });

  it('set 2 with extension', () => {
    const address = 'https://-hexlet-.io/courses/makeSomething.js';
    const expected = 'hexlet-io-courses-makeSomething.js';
    expect(makeNameWithExt(address)).toBe(expected);
  });
});

describe('Download', () => {
  it('invoke without url', () => {
    expect(() => {
      download();
    }).toThrow();
  });

  it('non-existent directory', async () => {
    const address = 'https://hexlet.io/courses';
    const outDir = '/non/existent';
    await expect(download(address, outDir)).rejects.toThrow();
  });

  it('set1', async () => {
    const fixtures = path.join(__dirname, '__fixtures__');

    const data = await fs.readFile(path.join(fixtures, 'before.html'), 'utf-8');
    nock('https://hexlet.io').get('/courses').reply(200, data);

    const image = await fs.readFile(path.join(fixtures, 'icon.png'));
    nock('https://test.ru').get('/icon.png').reply(200, image);

    const script = await fs.readFile(path.join(fixtures, 'script.js'));
    nock('https://test.ru').get('/script.js').reply(200, script);

    const style = await fs.readFile(path.join(fixtures, 'style.css'));
    nock('https://test.ru').get('/style.css').reply(200, style);

    const address = 'https://hexlet.io/courses';
    const outDir = await mkdtemp();
    await download(address, outDir);

    const expected1 = [
      'hexlet-io-courses.html',
      'hexlet-io-courses_files',
    ];
    const files1 = await fs.readdir(outDir);
    expect(files1).toEqual(expected1);

    const expected2 = [
      'test-ru-icon.png',
      'test-ru-script.js',
      'test-ru-style.css',
    ];
    const files2 = await fs.readdir(path.join(outDir, expected1[1]));
    expect(files2).toEqual(expected2);

    const resultHtml = await fs.readFile(path.join(outDir, 'hexlet-io-courses.html'), 'utf-8');
    const expectedHtml = await fs.readFile(path.join(fixtures, 'after.html'), 'utf-8');
    expect(resultHtml).toBe(expectedHtml);
  });
});
