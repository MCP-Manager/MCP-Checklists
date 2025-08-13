import { readdir } from 'fs/promises';
import { extname } from 'path';

/**
 * Retrieves a list of files from the given directory.
 *
 * @param {string} directory
 * @param {{ fileExtension?: string; }} [options]
 * @returns {Promise<string[]>}
 */
export async function getFilesInDirectory(directory, { fileExtension } = {}) {
  try {
    const files = await readdir(directory);
    return files.filter((file) => !fileExtension || extname(file).toLowerCase() === fileExtension);
  } catch (error) {
    console.error('An error occurred while reading the directory:', error);
    return [];
  }
}
