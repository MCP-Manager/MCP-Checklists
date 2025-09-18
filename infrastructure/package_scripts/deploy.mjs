// @ts-check
import { config } from '@dotenvx/dotenvx';
import { readMultipleChoice } from './dotenv/read_multiple_choice.mjs';
import { parseArgsWithHelp } from './utilities/parse_args_with_help.mjs';
config({ override: true });

/** @description Build & deploy the docker application */
/** @example pnpm run deploy -a | --dokkuApp example ~ Build and deploy a docker image. */
/** @example pnpm run deploy -a example -y | --areYouSure ~ Build and deploy a docker image, skipping the "Are you sure?" check. */
const { outputPrefix, values: argv } = parseArgsWithHelp(import.meta.url, {
  options: {
    dokkuApp: {
      type: 'string',
      short: 'a',
      description: 'Dokku app to deploy, defaults to the name in package.json.',
    },
    areYouSure: {
      type: 'boolean',
      short: 'y',
      default: true,
      description: '(optional) Skip are you sure check.',
    },
  },
});

if(
  !argv.dokkuApp
) {
  throw new Error('App name is required, provide with -a argument, ex: -a appName');
}

const answer = argv.areYouSure
  ? 'yes'
  : await readMultipleChoice(`Are you sure you want to deploy development?`, ['no', 'yes'], {
      enableHotkeys: true,
    });

if (!answer.toLowerCase().startsWith('y')) {
  console.log(`${outputPrefix}Aborting deployment development`);
  process.exit(0);
}
console.log(`${outputPrefix}Starting development deployment`);

process.argv.push(`--app_name=${argv.dokkuApp}`);

await import('./utilities/dokku_deploy.mjs');
