// @ts-check
import { NodeSSH } from "node-ssh";
import { parseArgsWithHelp } from "./utilities/parse_args_with_help.mjs";
import { printDuration } from "./utilities/performance_utils.mjs";
import { config } from "@dotenvx/dotenvx";

config({ override: true });

/** @description Builds a docker image that can later be run or deployed. */
/** @example pnpm create ~ Build a docker image and deploy it to a remote Dokku host. */
/** @example pnpm create -a|--dokkuApp example ~ Set the dokku app name. */
/** @example pnpm create -e|--sslEmailContact example@email.com ~ Set the email contact for SSL certificate. */
const { values: argv, outputPrefix } = parseArgsWithHelp(import.meta.url, {
  options: {
    dokkuApp: {
      description: `(required) name of app to deploy`,
      type: `string`,
      short: `a`,
    },
    sslEmailContact: {
      description: `(required) email contact for letsencrypt`,
      type: `string`,
      short: `e`,
    },
  },
});

if (!argv.dokkuApp) {
  throw new Error(
    "App name is required, provide with -a argument, ex: -a appName"
  );
}
if (!argv.sslEmailContact) {
  throw new Error(
    "SSL email contact is required, provide with -e argument, ex: -e email@example.com"
  );
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
      onStdout: (chunk) => process.stdout.write(chunk.toString("utf8")),
      onStderr: (chunk) => process.stderr.write(chunk.toString("utf8")),
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

const appName = argv.dokkuApp;
const emailContact = argv.sslEmailContact;

let suceeded = true;
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

  try {
    console.log(`${outputPrefix}Setting port mappings on: '${appName}'`);
    await sshCommand(`dokku ports:set ${appName} http:80:5000 https:443:5000`);
  } catch (error) {
    console.error(
      `${outputPrefix}Error setting port mappings on: '${appName}'`
    );
    throw error;
  }

  console.log(`${outputPrefix}Setting env vars on: '${appName}'`);
  if (process.env.ACCESS_TOKEN) {
    await sshCommand(`dokku config:set ${appName} ACCESS_TOKEN=${process.env.ACCESS_TOKEN || ""}`);
  }

  try {
    await import("./deploy.mjs");
  } catch (error) {
    console.error(`${outputPrefix}Error deploying: '${appName}'`);
    throw error;
  }

  try {
    console.log(
      `${outputPrefix}Setting letsecrypt contact email on: '${appName}'`
    );
    await sshCommand(`dokku letsencrypt:set ${appName} email ${emailContact}`);
    console.log(`${outputPrefix}Enabling SSL (HTTPS) on: '${appName}'`);
    await sshCommand(`dokku letsencrypt:enable ${appName}`);
  } catch (error) {
    console.error(`${outputPrefix}Error enabling SSL on: '${appName}'`);
    throw error;
  }

  console.log(`${outputPrefix}App created: '${appName}'`);
} catch (error) {
  suceeded = false;
  console.error(error);
} finally {
  ssh.dispose();
}

if (!suceeded) {
  process.exit(1);
}
