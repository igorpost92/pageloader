#!/usr/bin/env node
import programm from 'commander';
import Listr from 'listr';

import { version } from '../../package.json';
import download from '../';

process.on('uncaughtException', (err) => {
  console.error(err.message);
  process.exitCode = 1;
});

const action = (url, dir) => {
  const tasks = new Listr([
    {
      title: 'Saving page',
      task: () => download(url, dir),
    },
  ]);

  tasks.run()
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 2;
    });
};

programm
  .version(version)
  .arguments('<url>')
  .description('Downloads a website to your local computer.')
  .option('-o, --output [dir]', 'output directory')
  .action((url) => {
    action(url, programm.output);
  })
  .parse(process.argv);

if (!programm.args.length) {
  programm.help();
}
