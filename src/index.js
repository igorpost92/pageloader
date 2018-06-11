import { get } from 'axios';
import { tmpdir } from 'os';
import path from 'path';
import fs from 'mz/fs';

import { makeName } from './utils';

const download = (siteUrl, outDir = tmpdir()) => {
  if (!siteUrl) {
    throw new Error('Website url is not provided');
  }

  return fs.stat(outDir)
    .then((stats) => {
      if (!stats.isDirectory()) {
        throw new Error('Provided path is not a directory');
      }

      return get(siteUrl);
    })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Returned code ${response.status}: ${response.statusTest}`);
      }

      const name = makeName(siteUrl);
      const pathfile = path.join(outDir, `${name}.html`);
      return fs.writeFile(pathfile, response.data);
    })
    .catch((err) => {
      throw err;
    });
};

export default download;
