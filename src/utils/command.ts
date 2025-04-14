import { execSync } from "child_process";

export interface CommandOptions {
  env?: NodeJS.ProcessEnv;
  maxBuffer?: number;
}

export interface CommandError extends Error {
  stdout?: string;
  stderr?: string;
  cmd?: string;
  code?: number | string;
  signal?: string;
}

// Default buffer size (100MB)
const DEFAULT_BUFFER_SIZE_MB = 100;

// Convert MB to bytes and handle the environment variable
export const MAX_BUFFER_SIZE = process.env.STEAMPIPE_MCP_MEMORY_MAX_MB 
  ? parseInt(process.env.STEAMPIPE_MCP_MEMORY_MAX_MB, 10) * 1024 * 1024 // Convert MB to bytes
  : DEFAULT_BUFFER_SIZE_MB * 1024 * 1024;

export function executeCommand(cmd: string, options: CommandOptions = {}) {
  try {
    const execOptions = {
      encoding: 'utf-8' as const,
      env: options.env || process.env,
      maxBuffer: options.maxBuffer || MAX_BUFFER_SIZE
    };

    const output = execSync(cmd, execOptions);
    return output;
  } catch (error) {
    // If it's an error from execSync, it will have stdout and stderr properties
    if (error && typeof error === 'object') {
      const execError = error as { stderr?: Buffer; stdout?: Buffer; code?: number | string; signal?: string };
      const stderr = execError.stderr?.toString().trim() || '';
      const stdout = execError.stdout?.toString().trim() || '';
      const code = execError.code;
      const signal = execError.signal;

      // Create a detailed error object
      const commandError = new Error() as CommandError;
      commandError.cmd = cmd;
      commandError.code = code;
      commandError.signal = signal;
      commandError.stdout = stdout;
      commandError.stderr = stderr;

      // Set an informative error message, excluding stdout to avoid verbosity
      const details = [
        stderr && `Error: ${stderr}`,
        code && `Exit code: ${code}`,
        signal && `Signal: ${signal}`,
        `Command: ${cmd}`
      ].filter(Boolean).join('\n');

      commandError.message = details || 'Command execution failed with no error details';

      // Log the error details (including stdout for debugging purposes)
      console.error('Command execution failed:', {
        cmd,
        stderr,
        stdout,
        code,
        signal
      });

      throw commandError;
    }
    
    // Unknown errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Command execution failed:', {
      cmd,
      error: errorMessage
    });
    throw new Error(`Command execution failed: ${errorMessage}. Command: ${cmd}`);
  }
}

export function formatCommandError(error: unknown, context?: string): { isError: true; content: { type: "text"; text: string }[] } {
  let errorMessage: string;

  // JSON parsing errors
  if (error instanceof SyntaxError) {
    console.error('Failed to parse Steampipe CLI output:', error.message);
    errorMessage = `Failed to parse Steampipe CLI output: ${error.message}${context ? `. Command: ${context}` : ''}`;
  }
  // Command execution errors
  else if (error instanceof Error && isCommandError(error)) {
    const cmdError = error as CommandError;
    const details = [
      cmdError.stderr && `Error: ${cmdError.stderr}`,
      cmdError.code && `Exit code: ${cmdError.code}`,
      cmdError.signal && `Signal: ${cmdError.signal}`,
      cmdError.cmd && `Command: ${cmdError.cmd}`
    ].filter(Boolean).join('\n');

    errorMessage = `Failed to run Steampipe CLI:\n${details}`;
  }
  // Other Error instances
  else if (error instanceof Error) {
    errorMessage = error.message;
  }
  // Unknown errors
  else {
    errorMessage = String(error);
  }

  return {
    isError: true,
    content: [{
      type: "text",
      text: errorMessage
    }]
  };
}

// Type guard to check if an Error is a CommandError
function isCommandError(error: Error): error is CommandError {
  return (
    'stderr' in error ||
    'stdout' in error ||
    'cmd' in error ||
    'code' in error ||
    'signal' in error
  );
} 