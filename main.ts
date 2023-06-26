import yargs from 'https://deno.land/x/yargs/deno.ts'
import { Arguments } from 'https://deno.land/x/yargs/deno-types.ts'

import { up } from './src/migrations/01-create-db.ts';
import { db } from "./src/database.ts";
import { parse } from './src/commands/parse.ts';
import { importData } from "./src/commands/import.ts";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {

}

const signals = [
  'altsignals', 'bitsturtle', 'bk-cornix', 'bk-group'
];

const addSignalsArgs = (yargs: any) => {
  yargs.positional('signals', {
    describe: 'signal group to parse',
    type: 'string'
  });
  yargs.choices('signals', signals);
};

yargs(Deno.args)
  .command('download <files...>', 'download a list of files', (yargs: any) => {
    return yargs.positional('files', {
      describe: 'a list of files to do something with'
    })
  }, (argv: Arguments) => {
    console.info(argv)
  })
  .command('init', 'initialize database', (yargs: any) => {}, async (argv: Arguments) => {
    await up(db);
  })
  .command('verify', 'verify database', (yargs: any) => {}, (argv: Arguments) => {
      const query = db.prepareQuery('SELECT * FROM db_version');
      const result = query.all();
      query.finalize();

      console.log(result);
      const version = result[result.length - 1]['version' as any];

      console.info(`Current DB version: ${version}`)
  })
  .command('parse <directory> <signals>', 'Parse signals', (yargs: any) => {
    yargs.positional('directory', {
      describe: 'path to directory with signals to parse',
      type: 'string'
    });
    addSignalsArgs(yargs);
  }, async (argv: Arguments) => {
      await parse(argv.directory, argv.signals);
  })
  .command('import <directory> <signals>', 'Import signals to DB', (yargs: any) => {
    yargs.positional('directory', {
      describe: 'path to directory with signals to parse',
      type: 'string'
    });
    addSignalsArgs(yargs);
  }, async (argv: Arguments) => {
      await importData(argv.directory, argv.signals);
  })
  .command('export <signals> <file>', 'export signals', (yargs: any) => {
    addSignalsArgs(yargs);
  }, (argv: Arguments) => {

  })
  .strictCommands()
  .demandCommand(1)
  .version('version', '0.0.1').alias('version', 'V')
  .argv;
