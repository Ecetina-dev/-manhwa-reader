/**
 * Logging Service
 * 
 * Structured server-side logging for production monitoring
 */

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

interface RequestLog {
  method: string;
  path: string;
  status: number;
  duration: number;
  ip?: string;
  userAgent?: string;
}

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Current log level (configure via environment)
const CURRENT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

/**
 * Format log entry as JSON for structured logging
 */
function formatLog(level: LogEntry['level'], message: string, context?: Record<string, any>): string {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString()
  };
  
  return JSON.stringify(entry);
}

/**
 * Debug level logging
 */
export function debug(message: string, context?: Record<string, any>): void {
  if (LOG_LEVELS[CURRENT_LEVEL] <= LOG_LEVELS.debug) {
    console.debug(formatLog('debug', message, context));
  }
}

/**
 * Info level logging
 */
export function info(message: string, context?: Record<string, any>): void {
  if (LOG_LEVELS[CURRENT_LEVEL] <= LOG_LEVELS.info) {
    console.info(formatLog('info', message, context));
  }
}

/**
 * Warning level logging
 */
export function warn(message: string, context?: Record<string, any>): void {
  if (LOG_LEVELS[CURRENT_LEVEL] <= LOG_LEVELS.warn) {
    console.warn(formatLog('warn', message, context));
  }
}

/**
 * Error level logging
 */
export function error(message: string, context?: Record<string, any>): void {
  if (LOG_LEVELS[CURRENT_LEVEL] <= LOG_LEVELS.error) {
    console.error(formatLog('error', message, context));
  }
}

/**
 * Log API request
 */
export function logRequest(req: RequestLog): void {
  const level = req.status >= 500 ? 'error' : req.status >= 400 ? 'warn' : 'info';
  
  const message = `${req.method} ${req.path} ${req.status} ${req.duration}ms`;
  
  if (level === 'error') {
    error(message, {
      method: req.method,
      path: req.path,
      status: req.status,
      duration: req.duration,
      ip: req.ip,
      userAgent: req.userAgent
    });
  } else if (level === 'warn') {
    warn(message, {
      method: req.method,
      path: req.path,
      status: req.status,
      duration: req.duration
    });
  } else {
    info(message, {
      method: req.method,
      path: req.path,
      status: req.status,
      duration: req.duration
    });
  }
}

/**
 * Log database query (for debugging)
 */
export function logQuery(query: string, duration: number): void {
  debug(`Query (${duration}ms): ${query.substring(0, 200)}`);
}

/**
 * Log security event
 */
export function logSecurity(event: string, details: Record<string, any>): void {
  warn(`Security: ${event}`, details);
}

/**
 * Log user action (for analytics)
 */
export function logUserAction(action: string, details: Record<string, any>): void {
  info(`User Action: ${action}`, details);
}
