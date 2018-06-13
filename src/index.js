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

const saveFiles = (saveName, html, outDir) => {
  const relPath = `${saveName}_files`;
  const srcDir = path.join(outDir, relPath);

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
    },
  ];

  const processNodes = ({ tagName, attrName, extraFilter }) => {
    const selection = $(tagName);
    const nodes = extraFilter === undefined ? selection : selection.filter(extraFilter);
    return nodes
      .map((ind, el) => {
        const link = $(el).attr(attrName);
        const ext = path.extname(link);
        const withoutExt = ext.length ? link.slice(0, -ext.length) : link;

        const filename = `${makeName(withoutExt)}${ext}`;

        const relUrl = path.join(relPath, filename);
        const saveAs = path.join(srcDir, filename);

        $(el).attr(attrName, relUrl);
        return { link, saveAs };
      })
      .toArray();
  };

  const storeFile = ({ link, saveAs }) => {
    debug(`downloading: ${link}`);
    return get(link, { responseType: 'arraybuffer' })
      .then(({ data }) => {
        debug(`saving as: ${saveAs}`);
        return fs.writeFile(saveAs, data);
      }, (err) => {
        debEr('downloading error', '\n', err.message);
        console.error(`Error while loading file:\n${link}`);
      })
      .catch((err) => {
        debEr('saving error', '\n', err.message);
        console.error(`Error while saving file:\n${saveAs}`);
      });
  };

  const files = tags
    .map((tag) => {
      const res = processNodes(tag);
      return removeDuplicates(res);
    })
    .reduce((acc, el) => acc.concat(el));

  return fs.access(srcDir)
    .catch(() => fs.mkdir(srcDir))
    .then(() => Promise.all(files.map(storeFile)))
    .then(() => $.html());
};

const savePage = (urlLink, html, outDir) => {
  const name = makeName(urlLink);

  const onResolved = (result) => {
    const pathfile = path.join(outDir, `${name}.html`);
    debug(`saving page as: ${pathfile}`);
    return fs.writeFile(pathfile, result)
      .catch(() => {
        console.error('Error while saving page');
      });
  };

  return saveFiles(name, html, outDir)
    .then(onResolved);
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
