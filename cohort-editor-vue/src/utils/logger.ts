/* eslint-disable no-console */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  level: LogLevel
  enableInProd: boolean
}

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const config: LoggerConfig = {
  level: import.meta.env.DEV ? 'debug' : 'warn',
  enableInProd: false,
}

function shouldLog(level: LogLevel): boolean {
  if (!config.enableInProd && import.meta.env.PROD) {
    return level === 'error'
  }
  return levels[level] >= levels[config.level]
}

function formatMessage(tag: string, message: string): string {
  return `[${tag}] ${message}`
}

export const logger = {
  debug(tag: string, message: string, data?: unknown): void {
    if (shouldLog('debug')) {
      if (data !== undefined) {
        console.log(formatMessage(tag, message), data)
      } else {
        console.log(formatMessage(tag, message))
      }
    }
  },

  info(tag: string, message: string, data?: unknown): void {
    if (shouldLog('info')) {
      if (data !== undefined) {
        console.log(formatMessage(tag, message), data)
      } else {
        console.log(formatMessage(tag, message))
      }
    }
  },

  warn(tag: string, message: string, data?: unknown): void {
    if (shouldLog('warn')) {
      if (data !== undefined) {
        console.warn(formatMessage(tag, message), data)
      } else {
        console.warn(formatMessage(tag, message))
      }
    }
  },

  error(tag: string, message: string, error?: unknown): void {
    if (shouldLog('error')) {
      if (error !== undefined) {
        console.error(formatMessage(tag, message), error)
      } else {
        console.error(formatMessage(tag, message))
      }
    }
  },

  setLevel(level: LogLevel): void {
    config.level = level
  },

  setEnableInProd(enable: boolean): void {
    config.enableInProd = enable
  },
}

export default logger
