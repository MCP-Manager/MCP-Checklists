import readline from 'node:readline';

// ANSI escape codes for cursor control and formatting
const ANSI_CODES = {
  up: (count = 1) => `\x1B[${count}A`,
  clearLine: '\x1B[2K',
  moveTo: (count = 1) => `\x1B[${count}G`,
  underlineStart: '\x1B[4m',
  underlineEnd: '\x1B[24m',
  // Add a code to move left one character
  backspace: '\x1B[D',
};

/**
 * Custom error class for duplicate hotkey errors
 */
class DuplicateHotkeyError extends Error {
  constructor(hotkey, options) {
    const message = `Duplicate hotkey '${hotkey}' found in options: ${options.join(', ')}`;
    super(message);
    this.name = 'DuplicateHotkeyError';
    this.hotkey = hotkey;
    this.affectedOptions = options;
  }
}

/**
 * Function to select from multiple options using arrow keys or hotkeys
 * @param {string} prompt The prompt to display
 * @param {string[]} options List of options to choose from
 * @param {Object} [config] Configuration options
 * @param {boolean} [config.enableHotkeys=false] Whether to enable hotkey selection
 * @returns {Promise<string>}
 * @throws {DuplicateHotkeyError} When duplicate hotkeys are detected
 */
export function readMultipleChoice(prompt, options, { enableHotkeys = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Parse options for hotkeys
    const parsedOptions = enableHotkeys ? parseOptionsWithHotkeys(options) : options.map((text) => ({ text }));

    // Configure stdin for raw mode
    process.stdin.setEncoding('utf8');
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    let selectedIndex = 0;
    let firstRender = true;

    // Function to render the menu
    const renderMenu = () => {
      // If not the first render, move cursor up to the first option
      if (!firstRender) {
        process.stdout.write(ANSI_CODES.up(options.length));
      }

      // Show the prompt only on first render
      if (firstRender) {
        console.log(prompt + '\n');
        firstRender = false;
      }

      // Display all options with cursor
      parsedOptions.forEach((option, index) => {
        // Clear the current line
        process.stdout.write(ANSI_CODES.clearLine);

        // Move cursor to start of line
        process.stdout.write(ANSI_CODES.moveTo());

        // Write the option with appropriate prefix
        const prefix = index === selectedIndex ? '> ' : '  ';
        const displayText = enableHotkeys ? option.displayText : option.text;
        console.log(prefix + displayText);
      });
    };

    // Function to handle selection and cleanup
    const makeSelection = (index, addNewline = false) => {
      process.stdin.setRawMode(false);
      process.stdin.removeAllListeners('keypress');
      rl.close();
      if (addNewline) {
        console.log();
      }
      resolve(options[index]);
    };

    // Function to cleanup without selection
    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.removeAllListeners('keypress');
      rl.close();
    };

    try {
      // Initial render
      renderMenu();

      // Handle keypress events
      process.stdin.on('keypress', (str, key) => {
        if (key) {
          // Handle Ctrl+C
          if (key.ctrl && key.name === 'c') {
            cleanup();
            process.exit();
          }

          // Handle arrow keys and enter
          switch (key.name) {
            case 'up':
              selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : options.length - 1;
              renderMenu();
              break;

            case 'down':
              selectedIndex = selectedIndex < options.length - 1 ? selectedIndex + 1 : 0;
              renderMenu();
              break;

            case 'return':
              makeSelection(selectedIndex);
              break;

            default:
              if (enableHotkeys) {
                // Check for hotkey matches
                const pressedKey = (str || '').toLowerCase();
                const hotkeyIndex = parsedOptions.findIndex((option) => option.hotkey === pressedKey);

                if (hotkeyIndex !== -1) {
                  // Clear any printed character by moving left and writing a space
                  process.stdout.write(ANSI_CODES.backspace + ' ' + ANSI_CODES.backspace);

                  // Update the selected index and re-render
                  selectedIndex = hotkeyIndex;
                  renderMenu();

                  // Small delay to show the selection before resolving
                  setTimeout(() => makeSelection(hotkeyIndex, true), 100);
                }
              }
              break;
          }
        }
      });
    } catch (error) {
      cleanup();
      throw error;
    }
  });
}

/**
 * Parse options and automatically detect hotkeys
 * @param {string[]} options Array of option strings
 * @returns {Array<{text: string, displayText: string, hotkey: string}>}
 * @throws {DuplicateHotkeyError} When duplicate hotkeys are detected
 */
function parseOptionsWithHotkeys(options) {
  const hotkeyMap = new Map();

  const parsedOptions = options.map((text) => {
    // Find the first capital letter or first letter if no capitals
    const match = text.match(/[A-Z]/) || text.match(/[a-z]/);
    if (!match) {
      return { text, displayText: text, hotkey: null };
    }

    const hotkeyIndex = match.index;
    const hotkey = text[hotkeyIndex].toLowerCase();

    // Check for duplicate hotkeys
    if (hotkeyMap.has(hotkey)) {
      const duplicateOptions = [hotkeyMap.get(hotkey), text];
      throw new DuplicateHotkeyError(hotkey, duplicateOptions);
    }

    // Store the original text for this hotkey
    hotkeyMap.set(hotkey, text);

    // Create display text with ANSI underline codes around the hotkey
    const displayText =
      text.slice(0, hotkeyIndex) +
      ANSI_CODES.underlineStart +
      text[hotkeyIndex] +
      ANSI_CODES.underlineEnd +
      text.slice(hotkeyIndex + 1);

    return { text, displayText, hotkey };
  });

  return parsedOptions;
}
