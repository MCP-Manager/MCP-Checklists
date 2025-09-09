// @ts-check
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLine } from './dotenv/read_line.mjs';
import { readMultipleChoice } from './dotenv/read_multiple_choice.mjs';
import { parseArgsWithHelp } from './utilities/parse_args_with_help.mjs';
import { printDuration } from './utilities/performance_utils.mjs';
const __dirname = dirname(fileURLToPath(import.meta.url));

const { outputPrefix } = parseArgsWithHelp(import.meta.url);

//#region Params & Prompts
const MIN_PASSWORD_LENGTH = 10;
// Based on 1 second of KeePass (can be adjusted to increase difficulty)
const ARGON2_PARALLELISM = 1;
const ARGON2_ITERATIONS = 12; // key derivation (argon2id: https://soatok.blog/2022/12/29/what-we-do-in-the-etc-shadow-cryptography-with-passwords)
const ARGON2_MEMORY_SIZE = 134218; // 128 MiB
// Don't change these:
const ARGON2_KEY_SIZE = 32; // bytes (for a key length of 256)
const HASH_WASM_SALT_SIZE = 16; // bytes
const OUTPUT_DIRECTORY = resolve(__dirname, '../dotenv/encrypted_backups');
const DEFAULT_INPUT = '.env';
const DEFAULT_OUTPUT = 'dev';

let answer = await readMultipleChoice('Do you want to backup or restore dotenv files?', ['backup', 'restore'], {
  enableHotkeys: true,
});
/** @type {'encrypt' | 'decrypt'} */
const action = answer.startsWith('b') ? 'encrypt' : 'decrypt';
let outputFile = '';
let inputFile = '';
let password = '';
let passwordHint = '';
if (action === 'encrypt') {
  const defaultInput = DEFAULT_INPUT;
  answer = await readLine(`What is the input file? Stored in:\n${process.cwd()}/\nLeave empty for '${defaultInput}':`);
  inputFile = answer || defaultInput;

  const defaultOutput = DEFAULT_OUTPUT;
  answer = await readLine(
    `What is the output file name? Stored in:\n${OUTPUT_DIRECTORY}/\nLeave empty for '${defaultOutput}':`,
  );
  /** @type {'private' | 'shared'} */
  outputFile = `${OUTPUT_DIRECTORY}/${answer || defaultOutput}.json`;
  console.log(`${outputPrefix}Output file will be stored in: ${outputFile}`);

  answer = await readLine(`Enter the encryption password now:`, true);
  password = answer.trim();
  validatePassword(password);

  answer = await readLine(`Confirm the encryption password:`, true);
  if (password !== answer.trim()) {
    console.log("Passwords don't match, try again.");
    process.exit(0);
  }

  passwordHint = '';
} /* decrypt */ else {
  const defaultInput = DEFAULT_OUTPUT;
  answer = await readLine(
    `What is the input file name? Stored in:\n${OUTPUT_DIRECTORY}/\nLeave empty for '${defaultInput}':`,
  );
  inputFile = `${OUTPUT_DIRECTORY}/${answer || defaultInput}.json`;

  const defaultOutput = DEFAULT_INPUT;
  answer = await readLine(
    `What is the output file? Stored in:\n${process.cwd()}/\nLeave empty for '${defaultOutput}':`,
  );
  outputFile = answer || defaultOutput;

  answer = await readLine(`Enter the dencryption password now:`, true);
  password = answer.trim();
}
//#endregion Params & Prompts

const startTime = performance.now();

//#region Encryption functions
/**
 * Encrypts data using AES-GCM with an Argon2id-derived key
 * @param {Uint8Array} plainText - The data to encrypt
 * @param {string} password - The password to derive the encryption key from
 * @param {{ argon2id: (options: {
 *   iterations: number,
 *   parallelism: number,
 *   memorySize: number,
 *   hashLength: number,
 *   salt: Uint8Array,
 *   password: Uint8Array
 * }) => Promise<string> }} dependencies - External dependencies
 * @returns {Promise<{
 *   salt: string,
 *   iv: string,
 *   cipher: string
 * }>} Object containing hex strings of the salt, IV, and ciphertext
 */
async function encrypt(plainText, password, { argon2id }) {
  const encoder = new TextEncoder();

  // Generate salts and IV
  const salt = getRandomBytes(HASH_WASM_SALT_SIZE);
  const iv = getRandomBytes(ARGON2_KEY_SIZE);

  // Convert password to bytes
  const passwordBytes = encoder.encode(password);
  if (passwordBytes.length === 0) {
    throw new Error('Empty password');
  }

  // Derive key using Argon2id
  const derivedKey = await argon2id({
    iterations: ARGON2_ITERATIONS,
    parallelism: ARGON2_PARALLELISM,
    memorySize: ARGON2_MEMORY_SIZE,
    hashLength: ARGON2_KEY_SIZE / 2,
    salt: salt,
    password: passwordBytes,
  });

  // Import key for AES-GCM
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(derivedKey),
    {
      name: 'AES-GCM',
      length: ARGON2_KEY_SIZE * 8,
    },
    false,
    ['encrypt'],
  );

  // Pad plaintext
  const paddedPlainText = (() => {
    const output = [];
    const padAmount = ARGON2_KEY_SIZE - (plainText.length % ARGON2_KEY_SIZE);
    for (let i = 0; i < plainText.length; i++) {
      output.push(plainText[i]);
    }
    for (let i = 0; i < padAmount; i++) {
      output.push(padAmount);
    }
    return Uint8Array.from(output);
  })();

  // Encrypt with AES-GCM
  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    paddedPlainText,
  );

  return {
    salt: bytesToHexString(salt),
    iv: bytesToHexString(iv),
    cipher: bytesToHexString(new Uint8Array(cipherBuffer)),
  };
}

/**
 * Decrypts data that was encrypted with the encrypt function
 * @param {string} cipherHex - Hex string of the encrypted data
 * @param {string} ivHex - Hex string of the initialization vector
 * @param {string} saltHex - Hex string of the salt used for key derivation
 * @param {string} password - The password to derive the decryption key from
 * @param {{ argon2id: (options: {
 *   iterations: number,
 *   parallelism: number,
 *   memorySize: number,
 *   hashLength: number,
 *   salt: Uint8Array,
 *   password: Uint8Array
 * }) => Promise<string> }} dependencies - External dependencies
 * @returns {Promise<Uint8Array>} The decrypted data
 */
async function decrypt(cipherHex, ivHex, saltHex, password, { argon2id }) {
  const encoder = new TextEncoder();

  // Convert hex strings to bytes
  const cipher = hexStringToBytes(cipherHex);
  const iv = hexStringToBytes(ivHex);
  const salt = hexStringToBytes(saltHex);

  // Convert password to bytes
  const passwordBytes = encoder.encode(password);
  if (passwordBytes.length === 0) {
    throw new Error('Empty password');
  }

  // Derive key using Argon2id
  const derivedKey = await argon2id({
    iterations: ARGON2_ITERATIONS,
    parallelism: ARGON2_PARALLELISM,
    memorySize: ARGON2_MEMORY_SIZE,
    hashLength: ARGON2_KEY_SIZE / 2,
    salt: salt,
    password: passwordBytes,
  });

  // Import key for AES-GCM
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(derivedKey),
    {
      name: 'AES-GCM',
      length: ARGON2_KEY_SIZE * 8,
    },
    false,
    ['decrypt'],
  );

  // Decrypt with AES-GCM
  const plainTextBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    cipher,
  );

  // Remove padding
  const plainText = new Uint8Array(plainTextBuffer);
  const padAmount = plainText[plainText.length - 1];
  return plainText.slice(0, plainText.length - padAmount);
}
//#endregion Encryption functions

//#region Utility functions
/**
 * Gets random bytes using the crypto API
 * @param {number} size - Number of random bytes to generate
 * @returns {Uint8Array<ArrayBuffer>} Random bytes
 */
function getRandomBytes(size) {
  return crypto.getRandomValues(new Uint8Array(size));
}
/**
 * Converts a Uint8Array to a hex string
 * @param {Uint8Array<ArrayBuffer>} input - Bytes to convert
 * @returns {string} Hex string representation
 */
function bytesToHexString(input) {
  const hex = [];
  for (let i = 0; i < input.length; i++) {
    const current = input[i] < 0 ? input[i] + 256 : input[i];
    hex.push((current >>> 4).toString(16));
    hex.push((current & 0xf).toString(16));
  }
  return hex.join('');
}
/**
 * Converts a hex string to a Uint8Array
 * @param {string} input - Hex string to convert
 * @returns {Uint8Array<ArrayBuffer>} Byte array
 */
function hexStringToBytes(input) {
  const bytes = [];
  for (let c = 0; c < input.length; c += 2) {
    bytes.push(parseInt(input.substr(c, 2), 16));
  }
  return Uint8Array.from(bytes);
}
/**
 * Copied from: src/server/src/utilities/load_module_from_string.ts
 * @param {string} module
 * @returns object
 */
function loadModuleFromString(module) {
  const _fn = new Function('module', 'exports', module);
  const _module = { exports: {} };
  _fn(_module, _module.exports);
  return _module.exports;
}
function dateToFilename(date = new Date()) {
  // Force UTC to ensure consistent sorting regardless of timezone
  return (
    date.getUTCFullYear() +
    String(date.getUTCMonth() + 1).padStart(2, '0') +
    String(date.getUTCDate()).padStart(2, '0') +
    '_' +
    String(date.getUTCHours()).padStart(2, '0') +
    String(date.getUTCMinutes()).padStart(2, '0') +
    String(date.getUTCSeconds()).padStart(2, '0')
  );
}
function validatePassword(password) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password is too short, it must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
}
//#endregion Utility functions

//#region Encrypt / decrypt
const modulePath = resolve(__dirname, './dotenv/argon2.umd.min.js');
const moduleContents = readFileSync(modulePath).toString();
const { argon2id } = loadModuleFromString(moduleContents);
const inputContent = readFileSync(inputFile);

try {
  let result;
  if (action === 'encrypt') {
    validatePassword(password);
    // Encrypt the file contents
    const encrypted = await encrypt(inputContent, password, { argon2id });
    result = JSON.stringify(
      {
        salt: encrypted.salt,
        iv: encrypted.iv,
        cipher: encrypted.cipher,
        hint: passwordHint,
      },
      null,
      2,
    );
  } else if (action === 'decrypt') {
    // Parse the encrypted file
    const encryptedData = JSON.parse(inputContent.toString());
    // Decrypt the contents
    const decrypted = await decrypt(encryptedData.cipher, encryptedData.iv, encryptedData.salt, password, {
      argon2id,
    });
    result = decrypted;
  } else {
    throw new Error(`Invalid action: ${action}. Must be either 'encrypt' or 'decrypt'`);
  }

  // Write output
  if (outputFile) {
    writeFileSync(outputFile, result);
    console.log(`${outputPrefix}${action}ed content written to ${outputFile}`);
  } else {
    console.log(outputPrefix + result.toString());
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

console.log(`${outputPrefix} completed in ${printDuration(startTime)}`);
//#endregion Encrypt / decrypt
