import { getFilesInDirectory } from './utilities/get_files_in_directory.mjs';
import { extractJsDocHelp } from './utilities/jsdoc_utils.mjs';
import { packageJson } from './utilities/load_package_json.mjs';
import { printTable } from './utilities/print_table.mjs';

const fileNames = await getFilesInDirectory(`${process.cwd()}/infrastructure/package_scripts`, {
  fileExtension: '.mjs',
});
const fileDescriptionsMap = fileNames.reduce((accumulator, fileName) => {
  if (['cli.mjs', 'help.mjs'].includes(fileName)) {
    return accumulator;
  }
  const { description } = extractJsDocHelp(`${process.cwd()}/infrastructure/package_scripts/${fileName}`);

  accumulator[fileName.replace('.mjs', '')] = description;
  return accumulator;
}, {});
console.log(
  'NAME',
  `\n\t${packageJson.name}\n`,
  '\nINSTRUCTIONS',
  `\n\tRun commands with pnpm or node, ex: pnpm COMMAND [ARGS] | node --run COMMAND -- [ARGS].`,
  `\n\tSome commands may take arguments, pass -h as an argument to see their documentation, ex: pnpm clean -h\n`,
  '\nCOMMANDS',
);
printTable(
  Object.keys(fileDescriptionsMap).map((key) => ({ key, value: fileDescriptionsMap[key] })),
  { columns: ['key', 'value'], skipHeader: true },
);
