// @ts-check
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { extractJsDocHelp } from './jsdoc_utils.mjs';
import { tabulaFormat } from './print_table.mjs';

/**
 * @template {import('node:util').ParseArgsConfig & { outputPrefix?: string }} T
 * @param {string} fileUrl
 * @param {T} [config]
 */
export function parseArgsWithHelp(fileUrl, config) {
  let filePath = fileURLToPath(fileUrl);
  const extensionIndex = filePath.lastIndexOf('.mjs');
  let command;
  if (extensionIndex === -1) {
    command = filePath;
  } else {
    command = filePath.slice(0, extensionIndex);
  }
  command = command.slice(command.lastIndexOf('/') + 1);

  /** @type {T['options']} */
  const options = {
    help: {
      type: 'boolean',
      short: 'h',
    },
    ...config?.options,
  };
  const result = parseArgs({ strict: false, ...config, options });
  // @ts-ignore
  if (result.values.help) {
    const { description, examples, name } = extractJsDocHelp(filePath);
    const exampleKeys = Object.keys(examples);
    const args = Object.keys(config?.options ?? {}).map((key) => {
      // @ts-ignore
      const { type, short, description } = config?.options?.[key] ?? {};
      return {
        key: short ? `-${short} | --${key}` : `--${key}`,
        value: `:${type}` + (description ? ' ' + description : ''),
      };
    });
    const logParams = ['NAME', `\n\t${name}\n`];
    if (description) {
      logParams.push('\nDESCRIPTION', `\n\t${description ?? ''}\n`);
    }
    if (args.length > 0) {
      logParams.push('\nARGUMENTS', `\n${tabulaFormat(args, { columns: ['key', 'value'], skipHeader: true })}`);
    }
    if (exampleKeys.length > 0) {
      logParams.push(
        '\nEXAMPLES',
        `\n${tabulaFormat(
          exampleKeys.map((key) => ({ key, value: examples[key] })),
          { columns: ['key', 'value'], skipHeader: true },
        )}`,
      );
    }
    console.log(...logParams);
    process.exit();
  }
  return { ...result, outputPrefix: config?.outputPrefix || `[${command}]: ` };
}
