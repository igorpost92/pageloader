#!/usr/bin/env node
import programm from 'commander';

import { version } from '../../package.json';
import download from '../';

programm
  .version(version)
  .arguments('<url>')
  .description('Downloads a website to your local computer.')
  .option('-o, --output [dir]', 'output directory')
  .action((url) => {
    download(url, programm.output)
      .catch((err) => {
        console.error(err.message);
        process.exit(2);
      });
  })
  .parse(process.argv);

if (!programm.args.length) {
  programm.help();
}
