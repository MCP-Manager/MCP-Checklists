// @ts-check
import { config } from "@dotenvx/dotenvx";
import { NodeSSH } from "node-ssh";
import { parseArgsWithHelp } from "./utilities/parse_args_with_help.mjs";
import { printDuration } from "./utilities/performance_utils.mjs";
import { spawnPromise } from "./utilities/spawn_promise.mjs";
config({ override: true });

/** @description Opens a new intactive ssh session or execute a command remotely if arguments are specified. */
/** @example pnpm ssh ~ Initialize a new interactive ssh session based on the following environment variables: SSH_HOST, SSH_USERNAME, SSH_PASSWORD, SSH_PRIVATE_KEY, SSH_PRIVATE_KEY_PATH, SSH_PRIVATE_KEY_PASSWORD. */
/** @example pnpm ssh dokku ps:report syncado ~ Run a command remotely, in this case printing the status of the syncado dokku app. */
const { outputPrefix } = parseArgsWithHelp(import.meta.url);

async function sshCommand(cmd, options) {
  const startTime = performance.now();
  await ssh.execCommand(cmd, {
    onStdout: (chunk) =>
      !options?.silent && process.stdout.write(chunk.toString("utf8")),
    onStderr: (chunk) => process.stderr.write(chunk.toString("utf8")),
    ...options,
  });
  console.log(`${outputPrefix}${cmd} (${printDuration(startTime)})`);
}

const ssh = new NodeSSH();

try {
  const command = process.argv.splice(2).join(" ");

  // If we have a command run it and then exit, otherwise spawn an interactive SSH session
  if (!command) {
    let preSsh = process.env.SSH_PASSWORD ? `sshpass -p ${process.env.SSH_PASSWORD} ` : "";
    if (process.env.SSH_PRIVATE_KEY) {
      await spawnPromise(
        `echo ${process.env.SSH_PRIVATE_KEY} | ${preSsh}ssh -o IdentitiesOnly=yes -i /dev/stdin ${process.env.SSH_USERNAME}@${process.env.SSH_HOST}`,
        {
          forwardParams: false,
          outputPrefix,
        }
      );
    } else if (process.env.SSH_PRIVATE_KEY_PATH) {
      await spawnPromise(
        `${preSsh}ssh -o IdentitiesOnly=yes -i ${process.env.SSH_PRIVATE_KEY_PATH} ${process.env.SSH_USERNAME}@${process.env.SSH_HOST}`,
        {
          forwardParams: false,
          outputPrefix,
        }
      );
    } else {
      await spawnPromise(
        `${preSsh}ssh ${process.env.SSH_USERNAME}@${process.env.SSH_HOST}`,
        {
          forwardParams: false,
          outputPrefix,
        }
      );
    }
  } else {
    await ssh.connect({
      host: process.env.SSH_HOST,
      username: process.env.SSH_USERNAME,
      password: process.env.SSH_PASSWORD,
      privateKey: process.env.SSH_PRIVATE_KEY,
      privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH,
      passphrase: process.env.SSH_PRIVATE_KEY_PASSWORD,
    });
    await sshCommand(command, {
      outputPrefix,
    });
  }
} finally {
  ssh.dispose();
}
