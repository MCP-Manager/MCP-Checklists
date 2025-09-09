import readline from 'node:readline';

/**
 * Function to get a full line of input
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export function readLine(prompt, isPassword = false) {
  if (isPassword) {
    const stdout = process.stdout;
    const stdin = process.stdin;
    return new Promise((resolve, reject) => {
      let input = '';

      const handleInput = (data) => {
        const char = data.toString();

        switch (char) {
          case '\u0004': // Ctrl-d
          case '\r':
          case '\n':
            cleanup();
            resolve(input);
            break;

          case '\u0003': // Ctrl-c
            cleanup();
            reject(new Error('User cancelled input'));
            break;

          case '\u007f': // DEL (backspace)
          case '\b': // Backspace
            if (input.length > 0) {
              input = input.slice(0, -1);
              // Move cursor back, write space to clear character, move back again
              stdout.write('\b \b');
            }
            break;

          default:
            // Only add printable characters (avoid control characters)
            if (char.charCodeAt(0) >= 32 && char.charCodeAt(0) < 127) {
              input += char;
              // For password input, you might want to show asterisks
              // stdout.write('*');
            }
        }
      };

      const cleanup = () => {
        stdin.removeListener('data', handleInput);
        stdin.setRawMode(false);
        stdin.pause();
        stdout.write('\n');
      };

      // Initialize stdin
      stdout.write(prompt);
      console.log();
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf-8');

      // Set up event listener
      stdin.on('data', handleInput);
    });
  }

  return new Promise((resolve) => {
    // Print the prompt first and then move to new line
    process.stdout.write(prompt + '\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    // Listen for line event instead of using question
    rl.on('line', (line) => {
      rl.close();
      console.log();
      resolve(line);
    });

    // Handle Ctrl+C
    rl.on('SIGINT', () => {
      rl.close();
      process.exit();
    });
  });
}
