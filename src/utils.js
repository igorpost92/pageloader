import url from 'url';
import { tmpdir } from 'os';
import fs from 'fs';
import { sep } from 'path';

export const makeName = (siteUrl) => {
  const { protocol, slashes, ...rest } = url.parse(siteUrl);
  const address = url.format(rest);

  const symbols = [...address].map((c) => {
    switch (true) {
      case c >= '0' && c <= '9':
      case c >= 'A' && c <= 'Z':
      case c >= 'a' && c <= 'z':
        return c;
      default:
        return '-';
    }
  });

  return symbols.join('');
};

export const mkdtemp = () => new Promise((resolve, reject) => {
  fs.mkdtemp(`${tmpdir()}${sep}`, (err, folder) => {
    if (err) {
      reject(err);
    } else {
      resolve(folder);
    }
  });
});
