import yargs from 'https://deno.land/x/yargs/deno.ts'
import { Arguments } from 'https://deno.land/x/yargs/deno-types.ts'

import { up } from './src/migrations/01-create-db.ts';
import { getDatabaseFromPath } from "./src/database.ts";
import { parse } from './src/commands/parse.ts';
import { importData } from "./src/commands/import.ts";
import { exportFromSource } from './src/commands/export.ts';

const signals = [
  'altsignals', 'bitsturtle', 'bk-cornix', 'bk-group', 'generic', 'wallstreet-queen',
  'cryptokey', 'binance-master', 
];

const addSignalsArgs = (yargs: any) => {
  yargs.option('signals', {
    describe: 'signal group to parse',
    type: 'string',
    default: 'generic'
  });
  yargs.choices('signals', signals);
};

const addDbArg = (yargs: any) => {
  yargs.option('database', {
    describe: 'database path',
    type: 'string',
    default: 'database.dat'
  });
};

const addInputFilesArg = (yargs: any) => {
  yargs.positional('inputFiles', {
    describe: 'Path to directory with signals files or to individual signal .html files',
    type: 'string[]'
  });
};

const addOutputPathArg = (yargs: any) => {
  yargs.option('outputPath', {
    describe: 'Exported .csv file path',
    type: 'string'
  });
};

const addExportOutputFormatArg = (yargs: any) => {
  const exportFormats = ['csv', 'order-json'];

  yargs.option('format', {
    describe: 'Export format',
    type: 'string',
    default: 'order-json'
  });

  yargs.choices('format', exportFormats);
};

yargs(Deno.args)
  .command('init', 'initialize database', (yargs: any) => {
    addDbArg(yargs);
  }, async (argv: Arguments) => {
    const db = await getDatabaseFromPath(argv.database);
    await up(db);
  })
  .command('verify', 'verify database', (yargs: any) => {
    addDbArg(yargs);
  }, async (argv: Arguments) => {
      const db = await getDatabaseFromPath(argv.database);

      const query = db.prepareQuery('SELECT * FROM db_version');
      const result = query.all();
      query.finalize();

      const version = result[result.length - 1]['version' as any];

      console.info(`Current DB version: ${version}`)
  })
  .command('parse <inputFiles...>', 'Parse signals', (yargs: any) => {
    addInputFilesArg(yargs);
    addSignalsArgs(yargs);
  }, async (argv: Arguments) => {
      await parse(argv.inputFiles, argv.signals);
  })
  .command('import <inputFiles...>', 'Import signals to DB', (yargs: any) => {
    addInputFilesArg(yargs);
    addDbArg(yargs);
    addSignalsArgs(yargs);
  }, async (argv: Arguments) => {
      const db = await getDatabaseFromPath(argv.database);
      await importData(argv.inputFiles, argv.signals, db);
  })
  .command('export <outputPath>', 'Export signals from DB to CSV', (yargs: any) => {
    addOutputPathArg(yargs);
    addDbArg(yargs);
    yargs.option('anonymize');

    addSignalsArgs(yargs);
  }, (argv: Arguments) => {
    console.log('Currently not implemented');
  })
  .command('export-from-source <inputFiles...>', 'Export signals from source', (yargs: any) => {
    addOutputPathArg(yargs);
    addInputFilesArg(yargs);
    addExportOutputFormatArg(yargs);

    yargs.option('anonymize');
    yargs.option('locale', {
      type: 'string'
    });
    yargs.option('delimiter', {
      type: 'string'
    });

    addSignalsArgs(yargs);
  }, async (argv: Arguments) => {
    const config = { locale: argv.locale ?? 'en-UK', delimiter: argv.delimiter ?? ',' };
    await exportFromSource(argv as any, config);
  })
  .command('supported-groups', 'Shows supported groups', () => {}, () => {
    signals.forEach(group => console.log(group));
  })
  .strictCommands()
  .demandCommand(1)
  .version('version', '0.0.1').alias('version', 'V')
  .argv;
