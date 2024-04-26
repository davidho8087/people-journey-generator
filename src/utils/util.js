/**
 * Sleeps for a specified number of milliseconds.
 * @param {number} milliseconds - The number of milliseconds to sleep.
 * @returns {Promise<void>} - A promise that resolves after the specified time.
 */
// Exporting the function declaration
export function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
