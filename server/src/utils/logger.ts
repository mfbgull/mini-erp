import winston from 'winston';
import path from 'path';

const { combine, timestamp, json, errors, printf } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'mini-erp-api',
    environment: process.env.NODE_ENV || 'development'
  },
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ],
  exitOnError: false
});

if (process.env.NODE_ENV === 'test') {
  logger.silent = true;
}

export default logger;
