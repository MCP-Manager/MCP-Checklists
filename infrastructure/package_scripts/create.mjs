//@ts-check
import { NodeSSH } from 'node-ssh';
import { parseArgsWithHelp } from './utilities/parse_args_with_help.mjs';
import { printDuration } from './utilities/performance_utils.mjs';
import { config } from '@dotenvx/dotenvx';
config({ override: true });

const { values: argv, outputPrefix } = parseArgsWithHelp(import.meta.url, {
  options: {
    app_name: {
      description: `(required) name of app to deploy`,
      type: `string`,
      short: `a`,
    },
    ssl_email_contact: {
      description: `(optional) email contact for letsencrypt`,
      type: `string`,
      default: 'g-alerts-engineering@mcpmanager.ai',
      short: `e`,
    },
  },
});

if (
  !argv.app_name
) {
  throw new Error('App name is required, provide with -a argument, ex: -a appName');
}

const ssh = new NodeSSH();

/**
 * @param {string} cmd
 * @param {import('node-ssh').SSHExecCommandOptions} [options]
 */
async function sshCommand(cmd, options) {
  try {
    const startTime = performance.now();
    console.log(`${outputPrefix}BEGIN_SSH: ${cmd}`);
    const result = await ssh.execCommand(cmd, {
      onStdout: (chunk) => process.stdout.write(chunk.toString('utf8')),
      onStderr: (chunk) => process.stderr.write(chunk.toString('utf8')),
      ...options,
    });
    if (result.code !== 0) {
      //@ts-ignore
      throw new Error(result.code);
    }
    console.log(`${outputPrefix}END_SSH: ${cmd} (${printDuration(startTime)})`);
  } catch (error) {
    console.error(`${outputPrefix}ERROR_SSH: ${error}`);
    throw error;
  }
}

const appName = argv.app_name;
const emailContact = argv.ssl_email_contact;

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
  console.log(`${outputPrefix}Creating app: '${appName}'`);
  try {
    await sshCommand(`dokku apps:create ${appName}`);
  } catch (error) {
    console.warn(error);
  }

  // Set letsencrypt email before deployment in case something goes wrong with it 
  console.log(`${outputPrefix}Setting letsecrypt contact email on: '${appName}'`);
  await sshCommand(`dokku letsencrypt:set ${appName} email ${emailContact}`);

  console.log(`${outputPrefix}Setting port mappings on: '${appName}'`);
  await sshCommand(`dokku ports:set ${appName} http:80:5000 https:443:5000`);

  console.log(`${outputPrefix}Setting NGINX_ACCESS_TOKEN env var on: '${appName}'`);
  await sshCommand(`dokku config:set ${appName} NGINX_ACCESS_TOKEN=${process.env.NGINX_ACCESS_TOKEN || ''}`);

  await import('./deploy.mjs');

  console.log(`${outputPrefix}Enabling SSL (HTTPS) on: '${appName}'`);
  await sshCommand(`dokku letsencrypt:enable ${appName}`);

  console.log(`${outputPrefix}App created: '${appName}'`);
  suceeded = true;
} catch (error) {
  console.error(error);
} finally {
  ssh.dispose();
}

if (!suceeded) {
  process.exit(1);
}
