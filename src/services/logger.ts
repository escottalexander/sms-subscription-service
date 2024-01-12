import * as winston from "winston";
import "winston-daily-rotate-file";
const { format, createLogger, transports } = winston;

const { combine, timestamp, printf } = format;

const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level.toUpperCase()}: ${message}`;
});

const fileRotateTransport = new transports.DailyRotateFile({
  filename: '%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine( timestamp(), customFormat),
  defaultMeta: { service: "sms-subscription-service" },
  transports: [
    fileRotateTransport,
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: combine(timestamp(), customFormat),
    })
  );
}

export default logger;
