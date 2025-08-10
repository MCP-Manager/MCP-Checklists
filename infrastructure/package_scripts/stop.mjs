import { parseArgsWithHelp } from './utilities/parse_args_with_help.mjs';
import { spawnPromise } from './utilities/spawn_promise.mjs';
import { packageJson } from './utilities/load_package_json.mjs';

/** @description Stops a running docker container. */
/** @example pnpm stop             ~ Starts a docker image, the tag . */
/** @example pnpm stop -t|--tag  ~ Allows you to specify the tag of the docker image to stop. */
/** @example pnpm stop -n|--name ~ Allows you to specift the name of the docker image to stop. */
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
  },
});

await spawnPromise(`docker stop ${argv.name} && docker rm ${argv.name}`, {
  forwardParams: false,
  outputPrefix,
});
