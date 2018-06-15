import { get } from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import cheerio from 'cheerio';
import dbg from 'debug';

import { makeName } from './utils';

const debug = dbg('pageloader');
const debEr = dbg('pageloader-ERROR');

const removeDuplicates = (items) => {
  const processed = new Set();
  const uniqs = items.filter(({ link }) => {
    if (processed.has(link)) {
      return false;
    }

    processed.add(link);
    return true;
  });
  return uniqs;
};

const downloadAsset = ({ link, relPath }, outDir) => {
  const saveAs = path.join(outDir, relPath);

  debug(`downloading: ${link}`);
  return get(link, { responseType: 'arraybuffer' })
    .then(({ data }) => {
      debug(`saving as: ${saveAs}`);
      return fs.writeFile(saveAs, data);
    }, (err) => {
      debEr('downloading error', '\n', err.message);
      // console.error(`Error while loading file: ${link}`);
    })
    .catch((err) => {
      debEr('saving error', '\n', err.message);
      // console.error(`Error while saving file:\n${saveAs}`);
    });
};

const extractAssets = (html, folder) => {
  const $ = cheerio.load(html);

  const tags = [
    {
      tagName: 'script',
      attrName: 'src',
      extraFilter: (ind, el) => $(el).attr('src') !== undefined,
    },
    {
      tagName: 'link',
      attrName: 'href',
      extraFilter: (ind, el) => $(el).attr('type') !== 'application/rss+xml',
    },
    {
      tagName: 'img',
      attrName: 'src',
      extraFilter: () => true,
    },
  ];

  const processNodes = ({ tagName, attrName, extraFilter }) => {
    const selection = $(tagName).filter(extraFilter).toArray();
    const assets = selection.map((el) => {
      // TODO:
      const link = $(el).attr(attrName);
      const ext = path.extname(link);
      const withoutExt = ext.length ? link.slice(0, -ext.length) : link;

      const filename = `${makeName(withoutExt)}${ext}`;
      const relPath = path.join(folder, filename);
      $(el).attr(attrName, relPath);
      return { link, relPath };
    });

    return removeDuplicates(assets);
  };

  const files = tags.map(processNodes)
    .reduce((acc, el) => acc.concat(el));

  return { content: $.html(), assets: files };
};

const makeDirForAssets = name => fs.access(name)
  .catch(() => fs.mkdir(name));

const savePage = (urlLink, html, outDir) => {
  const name = makeName(urlLink);
  const assetsDir = `${name}_files`;
  const assetsDirPath = path.join(outDir, assetsDir);

  const { content, assets } = extractAssets(html, assetsDir);

  return makeDirForAssets(assetsDirPath)
    .then(() => Promise.all(assets.map(asset => downloadAsset(asset, outDir))))
    .then(() => {
      const pathfile = path.join(outDir, `${name}.html`);
      debug(`saving page as: ${pathfile}`);
      return fs.writeFile(pathfile, content);
    })
    .catch(() => {
      throw new Error('Error while saving page');
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
