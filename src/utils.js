import url from 'url';
import { tmpdir } from 'os';
import { promises as fs } from 'fs';
import { sep } from 'path';

export const makeName = (siteUrl) => {
  const { protocol, slashes, ...rest } = url.parse(siteUrl);
  const address = url.format(rest);
  const newName = address
    .replace(/[^A-Za-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return newName;
};

export const mkdtemp = () => fs.mkdtemp(`${tmpdir()}${sep}pl`);
