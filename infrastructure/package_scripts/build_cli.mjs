import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { packageJson } from './utilities/load_package_json.mjs';
import { parseArgsWithHelp } from './utilities/parse_args_with_help.mjs';
import { printDuration } from './utilities/performance_utils.mjs';

/** @description Generates packageJson.scripts from your infrastructure/package_scripts directory. */
/** @example pnpm build_cli                                 ~ Builds NPM CLI. */
/** @example pnpm build_cli -d|--defaultBuildScript build ~ Allows you to change the default build script in VSCode. */
const { outputPrefix, values: argv } = parseArgsWithHelp(import.meta.url, {
  options: {
    defaultBuildScript: {
      type: 'string',
      short: 'd',
      default: 'build',
      description: '(optional) The default build script in tasks.json, defaults to "build".',
    },
  },
});

const startTime = performance.now();
const PACKAGE_SCRIPTS_DIR = 'infrastructure/package_scripts';
const runCommand = 'fnm use lts/latest --install-if-missing || : && node';

// get a list of unique file names in the 'infrastructure/package_scripts' folder
/** @type {Set<{name: string; extension: string}>} */
const uniqueFileNames = new Set();
const directoryContents = await fs.readdir(PACKAGE_SCRIPTS_DIR);
await Promise.all(
  directoryContents.map(async (subPath) => {
    const stat = await fs.stat(resolve(PACKAGE_SCRIPTS_DIR, subPath));
    if (stat.isFile()) {
      uniqueFileNames.add({
        name: subPath.substring(0, subPath.lastIndexOf('.')),
        extension: subPath.substring(subPath.lastIndexOf('.') + 1),
      });
    }
  }),
);

// sort the scripts record to ensure the file doesn't keep changing because of order changes
const scripts = [...uniqueFileNames].sort((a, b) => a.name.localeCompare(b.name));

packageJson.scripts = scripts.reduce((accumulator, { name, extension }) => {
  accumulator[name] = `${runCommand} ${PACKAGE_SCRIPTS_DIR}/${name}.${extension}`;
  return accumulator;
}, {});

// format & write package.json
await fs.writeFile(
  resolve(process.cwd(), 'package.json'),
  JSON.stringify(packageJson, null, 2),
);

if (existsSync('.vscode')) {
  // .vscode/launch.json & .vscode/tasts.json
  const [launch, tasks] = await Promise.all([
    (() =>
      fs
        .readFile(resolve(process.cwd(), '.vscode/launch.json'))
        .then((res) => JSON.parse(res.toString()))
        .catch(() => ({ version: '0.2.0', configurations: [] })))(),
    (() =>
      fs
        .readFile(resolve(process.cwd(), '.vscode/tasks.json'))
        .then((res) => JSON.parse(res.toString()))
        .catch(() => ({ version: '2.0.0', tasks: [] })))(),
  ]);

  tasks.tasks = [];
  launch.configurations = [];

  for (const { name, extension } of scripts) {
    const program = `${PACKAGE_SCRIPTS_DIR}/${name}.${extension}`;
    launch.configurations.push({
      name,
      type: 'node',
      request: 'launch',
      outputCapture: 'std',
      skipFiles: ['<node_internals>/**'],
      internalConsoleOptions: 'neverOpen',
      runtimeExecutable: 'bash',
      runtimeArgs: ['-l', '-c', `fnm exec --using=lts/latest -- node ${program}`, '--preserve-symlinks'],
      console: 'integratedTerminal',
    });
    tasks.tasks.push({
      type: 'shell',
      command: 'bash', // call bash
      args: [
        '-l', // login (aka load .bash_profile)
        '-c', // read commands from string
        `"${runCommand} ${program}"`, // run command
      ],
      label: name.replace('_', ' - '),
      group:
        name === argv.defaultBuildScript
          ? {
              kind: 'build',
              isDefault: true,
            }
          : 'build',
    });
  }

  // sort the records to ensure the files doesn't keep changing because of order changes
  launch.configurations.sort((a, b) => a.name.localeCompare(b.name));
  tasks.tasks.sort((a, b) => a.label.localeCompare(b.label));

  await Promise.all([
    (async function writeLaunchJson() {
      await fs.writeFile(
        resolve(process.cwd(), '.vscode/launch.json'),
        JSON.stringify(launch, null, 2),
      );
    })(),
    (async function writeTasksJson() {
      fs.writeFile(
        resolve(process.cwd(), '.vscode/tasks.json'),
        JSON.stringify(tasks, null, 2),
      );
    })(),
  ]);
}

console.log(`${outputPrefix}Completed in ${printDuration(startTime)}`);
