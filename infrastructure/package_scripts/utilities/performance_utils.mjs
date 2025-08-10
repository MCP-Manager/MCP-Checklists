/**
 * @param {number} startTime
 * @param {number} [decimals]
 */
export function secondsSince(startTime, decimals = 2) {
  const millis = performance.now() - startTime;
  return (millis / 1000).toFixed(decimals);
}

/**
 * @param {number} startTime
 */
export function minutesAndSecondsSince(startTime) {
  const millis = performance.now() - startTime;
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return seconds === '60' ? minutes + 1 + ':00' : minutes + ':' + (Number(seconds) < 10 ? '0' : '') + seconds;
}

/**
 * @param {number} startTime
 */
export function printDuration(startTime) {
  const elapsedMs = performance.now() - startTime;
  if (elapsedMs < 1) {
    return `${elapsedMs.toFixed(3)}ms`;
  }
  if (elapsedMs < 10) {
    return `${elapsedMs.toFixed(2)}ms`;
  }
  if (elapsedMs < 100) {
    return `${elapsedMs.toFixed(1)}ms`;
  }
  if (elapsedMs < 1_000) {
    return `${elapsedMs.toFixed(0)}ms`;
  }
  if (elapsedMs < 60_000) {
    return `${(elapsedMs / 1_000).toFixed(2)}s`;
  }
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = ((elapsedMs % 60000) / 1000).toFixed(0);
  return seconds === '60' ? `${minutes + 1}m:00s` : `${minutes}m:${(Number(seconds) < 10 ? '0' : '') + seconds}s`;
}
