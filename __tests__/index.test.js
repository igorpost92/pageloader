import path from 'path';
import nock from 'nock';
import fs from 'mz/fs';

import { makeName, mkdtemp } from '../src/utils';
import download from '../src/';

describe('Make name', () => {
  it('set1', () => {
    const address = 'https://hexlet.io/courses';
    const res = 'hexlet-io-courses';
    expect(makeName(address)).toBe(res);
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

    try {
      await download(address, outDir);
    } catch (error) {
      expect(error.code).toBe('ENOENT');
    }
  });

  it('set1', async () => {
    const address = 'https://hexlet.io/courses';
    const outDir = await mkdtemp();
    const resultFilepath = path.join(__dirname, '__fixtures__', 'ind.html');

    const data = await fs.readFile(resultFilepath, 'utf-8');

    nock('https://hexlet.io')
      .get('/courses')
      .reply(200, data);

    await download(address, outDir);
  });
});
