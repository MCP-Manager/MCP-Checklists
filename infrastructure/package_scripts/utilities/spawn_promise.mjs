// @ts-check
import { spawn } from 'node:child_process';
import { printDuration } from './performance_utils.mjs';

/**
 * @typedef {{
 *    silent?: boolean
 *    outputPrefix?: string
 *    forwardParams?: boolean
 *    captureOutput?: boolean
 *    shell?: string
 *    cwd?: string
 *  }
 * } SpawnPromiseOptions
 *
 * @param {string} command
 * @param {SpawnPromiseOptions} [options]
 */
export const spawnPromise = (command, options) =>
  new Promise((resolve, reject) => {
    /** @type {string} */
    let cmd;
    if (options?.forwardParams !== false) {
      const args = process.argv.slice(2);
      cmd = `${command}${args.length > 0 ? ` ${args.join(' ')}` : ''}`;
    } else {
      cmd = command;
    }

    if (!options?.silent) {
      console.log(`${options?.outputPrefix ?? ''}BEGIN: ${cmd}`);
    }
    let output = '';
    const startTime = performance.now();
    const child = spawn(options?.shell || 'sh', ['-c', cmd], {
      stdio: options?.captureOutput ? 'pipe' : 'inherit',
      ...options,
    }).on('close', (code) => {
      if (code) {
        reject(`${options?.outputPrefix ?? ''}'${cmd}'FAILED with code: ${code} (${printDuration(startTime)})`);
      } else {
        if (!options?.silent) {
          console.log(`${options?.outputPrefix ?? ''}END: ${cmd} (${printDuration(startTime)})`);
        }
        resolve(output || code);
      }
    });

    if (options?.captureOutput) {
      child.stdout?.on('data', (data) => {
        output += data;
      });
      child.stderr?.on('data', (data) => {
        output += data;
      });
    }
  });
