import url from 'url';
import path, { sep } from 'path';
import { tmpdir } from 'os';
import { promises as fs } from 'fs';

export const makeName = (link) => {
  const { protocol, slashes, ...rest } = url.parse(link);
  const address = url.format(rest);
  const newName = address
    .replace(/[^A-Za-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return newName;
};

export const makeNameWithExt = (link) => {
  const ext = path.extname(link);
  const withoutExt = ext.length ? link.slice(0, -ext.length) : link;
  const filename = `${makeName(withoutExt)}${ext}`;
  return filename;
};

export const mkdtemp = () => fs.mkdtemp(`${tmpdir()}${sep}pl`);
