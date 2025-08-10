// @ts-check
import { randomFillSync } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgsWithHelp } from './utilities/parse_args_with_help.mjs';

/** @description Generate a cryptographically secure key using Node's built in crypto module. */
/** @example pnpm gen_key               ~ Print key to the console. */
/** @example pnpm gen_key -f secret.key ~ Save key to a file. */
const { outputPrefix, values: argv } = parseArgsWithHelp(import.meta.url, {
  options: {
    size: {
      short: 's',
      type: 'string',
      default: '32',
      description: '(optional) size of the key in bytes. Default is 32 bytes.',
    },
    filePath: {
      short: 'f',
      type: 'string',
      description: '(optional) provide a file path to save the secret in a file.',
    },
  },
});

const size = Number(argv.size);
if (isNaN(size) || size <= 0) {
  console.error('Invalid number of characters. Must be a positive integer.');
  process.exit(1);
}

const buffer = Buffer.allocUnsafe(size);
const secret = randomFillSync(buffer).toString('hex');
if (argv.filePath) {
  const filePath = resolve(/** @type {string} */ (argv.filePath));
  writeFileSync(filePath, secret);
  console.log(`${outputPrefix}Key saved to: ${filePath}`);
} else {
  console.log(outputPrefix + secret);
}
