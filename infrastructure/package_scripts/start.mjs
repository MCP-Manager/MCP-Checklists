import { config } from '@dotenvx/dotenvx';
import { parseArgsWithHelp } from './utilities/parse_args_with_help.mjs';
import { spawnPromise } from './utilities/spawn_promise.mjs';
import { packageJson } from './utilities/load_package_json.mjs';

/** @description Starts a pre-built docker image */
/** @example pnpm start                 ~ Starts a docker image, the tag . */
/** @example pnpm start -t|--tag      ~ Allows you to specify a tag for the docker image. */
/** @example pnpm start -n|--name     ~ Allows you to give a diffent name to the docker container. */
/** @example pnpm start -d|--detached ~ Allows you to launch the docker image in detached (background) mode. */
const { values: argv, outputPrefix } = parseArgsWithHelp(import.meta.url, {
  options: {
    tag: {
      short: 't',
      type: 'string',
      default: packageJson.name,
    },
    name: {
      short: 't',
      type: 'string',
      default: packageJson.name,
    },
    detached: {
      short: 'd',
      type: 'boolean',
      default: false,
    },
  },
});

const dotEnvVars = {};
config({ processEnv: dotEnvVars });

const envVars = Object.keys(dotEnvVars).reduce((accumulator, key) => {
  return accumulator + (accumulator ? ' ' : '') + `--env ${key}=${JSON.stringify(dotEnvVars[key])}`;
}, '');

try {
  await import('./stop.mjs');
} catch {
  /* noop */
}

await spawnPromise(`docker container run ${argv.detached ? '-d' : '-it'} -p 127.0.0.1:80:443/tcp -p 127.0.0.1:443:443/tcp --name ${argv.name} ${envVars} ${argv.tag}`, {
  forwardParams: false,
  outputPrefix,
});
