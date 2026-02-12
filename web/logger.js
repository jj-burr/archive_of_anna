const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '..', 'logs');
fs.existsSync(logsDir) || fs.mkdirSync(logsDir, { recursive: true });

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // Error log -- errors only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),

    // Access log -- info level, filtered to access entries only
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format((info) => {
          return info.type === 'access' ? info : false;
        })(),
        logFormat,
      ),
    }),

    // Application log -- info and above (searches, downloads, settings)
    new winston.transports.File({
      filename: path.join(logsDir, 'application.log'),
      level: 'info',
    }),

    // System log -- all levels including debug
    new winston.transports.File({
      filename: path.join(logsDir, 'system.log'),
      level: 'debug',
    }),

    // Console -- colorized
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ?
            ' ' + JSON.stringify(meta) : '';
          return `${timestamp} ${level}: ${message}${metaStr}`;
        }),
      ),
    }),
  ],
});

// Convenience method for access logging
logger.access = (message, meta = {}) => {
  logger.info(message, { ...meta, type: 'access' });
};

module.exports = logger;
