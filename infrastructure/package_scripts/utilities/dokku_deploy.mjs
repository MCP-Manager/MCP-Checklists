import { NodeSSH } from 'node-ssh';
import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { next as generate_xid } from 'xid-js';
import { parseArgsWithHelp } from './parse_args_with_help.mjs';
import { printDuration } from './performance_utils.mjs';
import { spawnPromise } from './spawn_promise.mjs';

const { values: argv, outputPrefix } = parseArgsWithHelp(import.meta.url, {
  options: {
    app_name: {
      description: `(required) name of app to deploy, defaults to stock-tools`,
      type: `string`,
      default: `cannastocks`,
      short: `a`,
    },
    local_directory: {
      description: `(optional) directory that will store locally created docker images`,
      type: `string`,
      default: `dist`,
      short: `l`,
    },
    remote_directory: {
      description: `(optional) directory of the remote ssh machine that will store uploaded docker images`,
      type: `string`,
      default: `tmp/docker_images`,
      short: `r`,
    },
    cwd: {
      description: `(optional) directory that contains the dockerfile`,
      type: `string`,
      default: process.cwd(),
    },
  },
});

const ssh = new NodeSSH();

/**
 * @param {string} cmd
 * @param {import('node-ssh').SSHExecCommandOptions} [options]
 */
async function sshCommand(cmd, options) {
  try {
    const startTime = performance.now();
    console.log(`${outputPrefix}BEGIN_SSH: ${cmd}`);
    const code = await ssh.execCommand(cmd, {
      onStdout: (chunk) => process.stdout.write(chunk.toString('utf8')),
      onStderr: (chunk) => process.stderr.write(chunk.toString('utf8')),
      ...options,
    });
    if (code.code !== 0) {
      throw new Error(code.code);
    }
    console.log(`${outputPrefix}END_SSH: ${cmd} (${printDuration(startTime)})`);
  } catch (error) {
    console.error(`${outputPrefix}ERROR_SSH: ${error}`);
    throw error;
  }
}

const localDirectory = resolve(argv.cwd, argv.local_directory);
const remoteDirectory = argv.remote_directory;
const appName = argv.app_name;
const tag = generate_xid();
const dockerImageTag = `dokku/${appName}:${tag}`;

let suceeded = false;
try {
  // Check we have a good SSH connection
  await ssh.connect({
    host: process.env.SSH_HOST,
    username: process.env.SSH_USERNAME,
    password: process.env.SSH_PASSWORD,
    privateKey: process.env.SSH_PRIVATE_KEY,
    privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH,
    passphrase: process.env.SSH_PRIVATE_KEY_PASSWORD,
  });

  // Build docker image
  console.log(`${outputPrefix}Building image: '${appName}:${tag}', please wait...`);
  await spawnPromise(
    `node --run build -- --tag=${dockerImageTag}${process.env.MODE === 'development' ? ' --development' : ''}`,
    {
      outputPrefix: `${outputPrefix}`,
      forwardParams: false,
      cwd: argv.cwd,
    },
  );

  // Save docker image to disk
  console.log(`${outputPrefix}Creating archive from image, please wait...`);
  await mkdir(localDirectory, { recursive: true });
  await spawnPromise(`docker image save ${dockerImageTag} | gzip > ${localDirectory}/${appName}_${tag}.tar.gz`, {
    outputPrefix: `${outputPrefix}`,
    forwardParams: false,
  });

  // Upload docker image archive to remote
  await sshCommand(`mkdir -p ${remoteDirectory}`);
  console.log(`${outputPrefix}Uploading '${appName}_${tag}.tar.gz', please wait...`);
  const startTime = performance.now();
  await ssh.putFiles([
    {
      local: `${localDirectory}/${appName}_${tag}.tar.gz`,
      remote: `${remoteDirectory}/${appName}_${tag}.tar.gz`,
    },
  ]);
  console.log(`${outputPrefix}Upload of '${appName}_${tag}.tar.gz' completed in ${printDuration(startTime)}`);

  // Unpack & load docker image on remote
  await sshCommand(`docker load < ${appName}_${tag}.tar.gz`, { cwd: remoteDirectory });

  // Deploy docker image on remote
  await sshCommand(`dokku git:from-image ${appName} ${dockerImageTag}`);
  suceeded = true;
} catch (error) {
  console.error(error);
} finally {
  // Post-deployment cleanup (local commands must occur before remote commands)
  try {
    // Local commands (before remote)
    /* await spawnPromise(`rm ${appName}_${tag}.tar.gz`, {
      cwd: localDirectory,
      outputPrefix: `${outputPrefix}`,
      forwardParams: false,
    }); */
    await rm(localDirectory, { recursive: true });

    // Remote commands (after local)
    // Ensure subsquent git based deployments work successfully
    // https://github.com/dokku/dokku/issues/5963#issuecomment-1615836280
    await sshCommand(`dokku git:set ${appName} source-image`);

    // Delete build artifacts on remote server
    await sshCommand('rm -f *', { cwd: remoteDirectory });
    await sshCommand(`docker image rm ${dockerImageTag}`);
  } catch {}

  ssh.dispose();
}

if (!suceeded) {
  process.exit(1);
}
