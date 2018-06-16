import { get } from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import dbg from 'debug';
import Listr from 'listr';
import { Observable } from 'rxjs';

import { makeName } from './utils';
import { extractAssets, downloadAssets } from './assets';

const debug = dbg('pageloader');
// const debEr = dbg('pageloader-ERROR'); // TODO:

const saveContent = (name, folder, content) => {
  const pathfile = path.join(folder, `${name}.html`);
  debug(`saving page as: ${pathfile}`);
  return fs.writeFile(pathfile, content);
};

const savePage = (urlLink, html, outDir) => {
  const name = makeName(urlLink);
  const assetsDir = `${name}_files`;
  const assetsDirPath = path.join(outDir, assetsDir);

  const { content, assets } = extractAssets(html, assetsDir);

  const tasks = new Listr([
    {
      title: 'Saving page',
      task: () => saveContent(name, outDir, content),
    },
    {
      title: 'Saving assets',
      task: ctx => new Observable(observer =>
        downloadAssets(ctx, observer, assets, outDir, assetsDirPath)),
    },
  ]);

  return tasks.run()
    .then(({ errors }) => {
      if (errors.length) {
        console.error('There was a problem while downloading assets:');
        errors.forEach(e => console.log(e.message));
      }
    });
};

const download = (siteUrl, outDir = process.cwd()) => {
  debug('start');
  debug(`outDir: ${outDir}`);

  if (!siteUrl) {
    throw new Error('Website url is not provided');
  }

  return fs.stat(outDir)
    .then((stats) => {
      if (!stats.isDirectory()) {
        throw new Error('Provided path is not a directory');
      }

      debug(`connecting: ${siteUrl}`);
      return get(siteUrl, { responseType: 'arraybuffer' });
    })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Returned code ${response.status}: ${response.statusTest}`);
      }

      return savePage(siteUrl, response.data, outDir);
    })
    .then(() => {
      debug('finish');
    });
};

export default download;
