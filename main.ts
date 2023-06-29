import yargs from 'https://deno.land/x/yargs/deno.ts'
import { Arguments } from 'https://deno.land/x/yargs/deno-types.ts'

import { up } from './src/migrations/01-create-db.ts';
import { db } from "./src/database.ts";
import { parse } from './src/commands/parse.ts';
import { importData } from "./src/commands/import.ts";
import { exportFromSource } from './src/commands/export.ts';

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
  .command('init', 'initialize database', (yargs: any) => {}, async (argv: Arguments) => {
    await up(db);
  })
  .command('verify', 'verify database', (yargs: any) => {}, (argv: Arguments) => {
      const query = db.prepareQuery('SELECT * FROM db_version');
      const result = query.all();
      query.finalize();

      const version = result[result.length - 1]['version' as any];

      console.info(`Current DB version: ${version}`)
  })
  .command('parse <signals> <inputFiles...>', 'Parse signals', (yargs: any) => {
    yargs.positional('inputFiles', {
      describe: 'Path to directory with signals files or to individual signal .html files',
      type: 'string[]'
    });
    addSignalsArgs(yargs);
  }, async (argv: Arguments) => {
      await parse(argv.inputFiles, argv.signals);
  })
  .command('import <signals> <inputFiles...>', 'Import signals to DB', (yargs: any) => {
    yargs.positional('inputFiles', {
      describe: 'Path to directory with signals files or to individual signal .html files',
      type: 'string[]'
    });
    addSignalsArgs(yargs);
  }, async (argv: Arguments) => {
      await importData(argv.inputFiles, argv.signals);
  })
  .command('export <signals> <outputPath>', 'Export signals from DB to CSV', (yargs: any) => {
    yargs.positional('outputPath', {
      describe: 'Exported .csv file path',
      type: 'string'
    });

    yargs.option('anonymize');

    addSignalsArgs(yargs);
  }, (argv: Arguments) => {
    console.log('Currently not implemented');
  })
  .command('export-from-source <signals> <outputPath> <inputFiles...>', 'Export signals from source to CSV', (yargs: any) => {
    yargs.positional('outputPath', {
      describe: 'Exported .csv file path',
      type: 'string'
    });

    yargs.positional('inputFiles', {
      describe: 'Path to directory with signals files or to individual signal .html files',
      type: 'string[]'
    });

    yargs.option('anonymize');

    addSignalsArgs(yargs);
  }, async (argv: Arguments) => {
    await exportFromSource(argv.inputFiles, argv.signals, argv.outputPath, argv.anonymize);
  })
  .strictCommands()
  .demandCommand(1)
  .version('version', '0.0.1').alias('version', 'V')
  .argv;
