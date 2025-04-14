/**
 * Logger utility for Steampipe MCP
 * 
 * Uses stderr for all output to avoid interfering with MCP protocol,
 * and supports suppressing logs during tests.
 */

// Define log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SILENT = 'silent'
}

interface LoggerOptions {
  level?: LogLevel;
  isTestEnvironment?: boolean;
}

export class Logger {
  private options: Required<LoggerOptions>;
  private logs: string[] = []; // Store logs when in test mode

  constructor(options: LoggerOptions = {}) {
    const envLevel = (process.env.STEAMPIPE_MCP_LOG_LEVEL || 'info').toLowerCase();
    this.options = {
      level: options.level || (this.isValidLogLevel(envLevel) ? envLevel as LogLevel : LogLevel.INFO),
      isTestEnvironment: options.isTestEnvironment || false
    };
  }

  private isValidLogLevel(level: string): level is LogLevel {
    return Object.values(LogLevel).includes(level as LogLevel);
  }

  /**
   * Configure the logger
   */
  configure(options: Partial<LoggerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  private shouldLog(targetLevel: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.SILENT];
    const currentLevelIndex = levels.indexOf(this.options.level);
    const targetLevelIndex = levels.indexOf(targetLevel);
    return currentLevelIndex <= targetLevelIndex && this.options.level !== LogLevel.SILENT;
  }

  /**
   * Debug level logging
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log('DEBUG', message, ...args);
    }
  }

  /**
   * Info level logging
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log('INFO', message, ...args);
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log('WARN', message, ...args);
    }
  }

  /**
   * Error level logging
   */
  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log('ERROR', message, ...args);
    }
  }

  /**
   * Internal log function
   */
  private log(level: string, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] [${level}] ${message}`;
    
    // Format additional arguments if present
    if (args.length > 0) {
      const formattedArgs = args.map(arg => {
        if (arg instanceof Error) {
          return arg.message;
        } else if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      });
      
      formattedMessage += `: ${formattedArgs.join(' ')}`;
    }
    
    // In test environment, store logs instead of printing
    if (this.options.isTestEnvironment) {
      this.logs.push(formattedMessage);
    } else {
      // Always use stderr to avoid interfering with MCP protocol
      console.error(formattedMessage);
    }
  }

  /**
   * Get collected logs (useful for tests)
   */
  getCollectedLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Clear collected logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

// Export singleton instance
export const logger = new Logger();