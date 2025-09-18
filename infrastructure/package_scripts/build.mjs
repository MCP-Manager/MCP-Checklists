import { config } from '@dotenvx/dotenvx';
import { parseArgsWithHelp } from './utilities/parse_args_with_help.mjs';
import { packageJson } from './utilities/load_package_json.mjs';
import { spawnPromise } from './utilities/spawn_promise.mjs';
config({ override: true });

/** @description Builds a docker image that can later be run or deployed. */
/** @example pnpm build                              ~ Builds a docker image that can later be run or deployed. */
/** @example pnpm build -t|--tag build             ~ Allows you to specify a tag for the docker image. */
/** @example pnpm build -p|--platform linux/x86_64 ~ Change the platform to build the docker image for. */
/** @example pnpm build -c|--no-cache              ~ Use this flag if you're iterating on your Dockerfile and it seems to break when it shouldn't. */
const { values: argv, outputPrefix } = parseArgsWithHelp(import.meta.url, {
  options: {
    tag: {
      short: 't',
      type: 'string',
      default: packageJson.name,
    },
    platform: {
      short: 'p',
      type: 'string',
      default: 'linux/x86_64',
    },
    ['no-cache']: {
      short: 'c',
      type: 'boolean',
    },
  },
});

const envVars = {
  NPM_MCP: process.env.NPM_MCP || "",
  NPM_MCP_ARGS: process.env.NPM_MCP_ARGS || "",
  SUPERGATEWAY_EXTRA_ARGS: process.env.SUPERGATEWAY_EXTRA_ARGS || "",
  NODE_VERSION: process.env.NODE_VERSION || "lts/latest",
};

const commands = [
  'docker',
  'build',
  '.',
  '--platform',
  argv.platform,
  '--tag',
  argv.tag,
  ...Object.entries(envVars).reduce((accumulator, [key, value]) => {
    if (value) {
      accumulator.push('--build-arg');
      accumulator.push(`${key}="${value}"`);
    }
    return accumulator;
  }, []),
];
if (argv['no-cache']) {
  commands.push('--no-cache');
}

await spawnPromise(commands.join(' '), {
  forwardParams: false,
  outputPrefix,
});
