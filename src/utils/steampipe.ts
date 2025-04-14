/**
 * Constructs a Steampipe CLI command with consistent flags and options
 * @param command The base command (e.g., 'source list', 'source show foo')
 * @param options Additional options to include
 * @returns The complete command string
 */
export function buildSteampipeCommand(command: string, options: { output?: string } = {}): string {
  const parts = ['steampipe'];

  // Add the command
  parts.push(command);

  // Add output format if specified
  if (options.output) {
    parts.push(`--output ${options.output}`);
  }

  return parts.join(' ');
}

/**
 * Gets the environment variables for Steampipe CLI execution
 * @returns Environment variables object
 */
export function getSteampipeEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    // Disable automatic update checking if needed
    STEAMPIPE_UPDATE_CHECK: 'false',
  };
} 