// @ts-check
import { readFileSync } from 'node:fs';
import { parse } from 'node:path';

export function extractJsDocHelp(filePath, file = readFileSync(filePath)) {
  const { name } = parse(filePath);
  let description = '';
  /** @type {Record<string, string>} */
  const examples = {};
  for (const [comment, start, end] of jsdocExtractor(file)) {
    if (!comment) {
      continue;
    }
    const strComment = comment.toString();
    if (strComment.includes('@description')) {
      description = cleanJSDocComment(strComment);
      continue;
    }
    if (strComment.includes('@example')) {
      const cleanedComment = cleanJSDocComment(strComment);
      let [key, example] = cleanedComment.split('\n');
      if (key && example) {
        examples[key.trim()] = example.trim();
        continue;
      }
      [key, example] = cleanedComment.split('~');
      if (key && example) {
        examples[key.trim()] = example.trim();
        continue;
      }
      [key, example] = cleanedComment.split('\t');
      if (key && example) {
        examples[key.trim()] = example.trim();
        continue;
      }
      examples[cleanedComment] = '';
    }
  }

  return { name, description, examples };
}

// Clean JSDoc formatting function
export function cleanJSDocComment(commentStr) {
  return commentStr
    .toString()
    .replace(/\/\*\*|\*\//g, '') // Remove /** and */
    .replace(/^\s*\*\s?/gm, '') // Remove leading * on each line
    .replace(/@(example|description)\s*/g, '') // Remove @tags
    .trim(); // Clean up extra whitespace
}

// https://gist.github.com/mhafemann/5da6ad7b0575d8a6a29cd77be254ba82

/**
 * @module extract-jsdoc
 * @license MIT
 * @file Extract-jsdoc.js - Extract JSDoc blocks from a Buffer
 */

// CONSTANTS
const SLASH = '/'.charCodeAt(0);
const STAR = '*'.charCodeAt(0);

/**
 * Extract all JSDoc blocks from a Buffer
 *
 * @example
 *   const jsdocExtractor = require("jsdoc-extractor");
 *   const { readFileSync } = require("fs");
 *   const buf = readFileSync("./sourceCode.js");
 *   for (const [doc, start, end] of jsdocExtractor(buf)) {
 *   console.log(`Found a new JSDoc block between ${start} and ${end}`);
 *   console.log(doc.toString());
 *
 * @function jsdocExtractor
 * @param {!Buffer} buf Buffer
 * @throws {TypeError}
 * @generator
 */
export function* jsdocExtractor(buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new TypeError('buf must be a Node.js Buffer');
  }

  let offset = 0;
  let inBlock = false;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === SLASH) {
      if (inBlock === false && buf[i + 1] === STAR && buf[i + 2] === STAR) {
        inBlock = true;
        offset = i;
      } else if (buf[i - 1] === STAR) {
        yield [buf.subarray(offset, i + 1), offset, i + 1];
        inBlock = false;
      }
    }
  }
}
