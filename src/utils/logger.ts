/**
 * Logger Utility
 * Centralized logging with environment-based controls
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!isDevelopment && level === 'debug') return false;
    return true;
  }

  error(message: string, error?: any) {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error || '');
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, data || '');
    }
  }

  debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }
}

export const logger = new Logger();
