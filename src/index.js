import { get } from 'axios';
import path from 'path';
import fs from 'mz/fs';
import cheerio from 'cheerio';

import { makeName } from './utils';

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

const storeSrcFile = ({ link, saveAs }) => get(link, { responseType: 'arraybuffer' })
  .then(({ data }) => fs.writeFile(saveAs, data))
  .catch(() => {
    // TODO: error during downloading file
    // https://cdn2.hexlet.io/assets/essential-a6af23ea2acf1f29eccada458f710ccfc9cb1d9d13dad1ab154a54fe65c167ee.js
  });

const processDocument = (urlLink, html, outDir) => {
  const name = makeName(urlLink);
  const relPath = `${name}_files`;
  const srcDir = path.join(outDir, relPath);

  const $ = cheerio.load(html);

  const processSourceFiles = (tagName, attrName, extraFilter) => {
    const selection = $(tagName);
    const tags = extraFilter === undefined ? selection : selection.filter(extraFilter);
    return tags
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

  const scripts = processSourceFiles('script', 'src', (ind, el) => $(el).attr('src') !== undefined);
  const links = processSourceFiles('link', 'href', (ind, el) => $(el).attr('type') !== 'application/rss+xml');
  const images = processSourceFiles('img', 'src');

  const files = removeDuplicates([...scripts, ...links, ...images]);

  const result = $.html();

  const pathfile = path.join(outDir, `${name}.html`);

  return fs.access(srcDir)
    .catch(() => fs.mkdir(srcDir))
    .then(() => Promise.all(files.map(storeSrcFile)))
    .then(() => fs.writeFile(pathfile, result));
};

const download = (siteUrl, outDir = process.cwd()) => {
  if (!siteUrl) {
    throw new Error('Website url is not provided');
  }

  return fs.stat(outDir)
    .then((stats) => {
      if (!stats.isDirectory()) {
        throw new Error('Provided path is not a directory');
      }

      return get(siteUrl, {
        responseType: 'arraybuffer',
      });
    })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Returned code ${response.status}: ${response.statusTest}`);
      }

      return processDocument(siteUrl, response.data, outDir);
    });
};

export default download;
