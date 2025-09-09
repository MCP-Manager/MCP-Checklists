import { spawnPromise } from '../utilities/spawn_promise.mjs';

await spawnPromise('df -h /', {
  outputPrefix: '[dokku/postdeploy]: ',
});
