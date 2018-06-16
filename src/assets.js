import cheerio from 'cheerio';
import dbg from 'debug';
import path from 'path';
import url from 'url';
import { get } from 'axios';
import { promises as fs } from 'fs';

import { makeNameWithExt } from './utils';

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

const downloadFile = ({ link, relPath }, outDir) => {
  const saveAs = path.join(outDir, relPath);

  debug(`downloading: ${link}`);
  return get(link, { responseType: 'arraybuffer' })
    .then(({ data }) => {
      debug(`saving as: ${relPath}`);
      return fs.writeFile(saveAs, data);
    })
    .catch((err) => {
      debEr('error', '\n', err.message);
      throw new Error(link);
    });
};

export const downloadAssets = (ctx, observer, assets, outDir, assetsFolder) => {
  const makeDirForAssets = name => fs.access(name)
    .catch(() => fs.mkdir(name));

  return makeDirForAssets(assetsFolder)
    .then(() => {
      ctx.errors = [];

      const downloading = new Promise((resolve) => {
        const iter = ([asset, ...rest]) => {
          const title = url.parse(asset.link).path;
          observer.next(title);

          return downloadFile(asset, outDir)
            .catch((e) => {
              ctx.errors.push(e);
            })
            .then(() => {
              if (!rest.length) {
                return resolve(); // TODO:
              }
              return iter(rest);
            });
        };

        return Promise.resolve().then(() => {
          iter(assets);
        });
      });

      return downloading.then(() => {
        observer.complete();
      });
    });
};

export const extractAssets = (html, folder) => {
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
      const link = $(el).attr(attrName);
      const filename = makeNameWithExt(link);
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
