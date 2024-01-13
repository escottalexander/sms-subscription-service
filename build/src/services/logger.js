"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var winston = __importStar(require("winston"));
require("winston-daily-rotate-file");
var format = winston.format, createLogger = winston.createLogger, transports = winston.transports;
var combine = format.combine, timestamp = format.timestamp, printf = format.printf;
var customFormat = printf(function (_a) {
    var level = _a.level, message = _a.message, timestamp = _a.timestamp;
    return "".concat(timestamp, " ").concat(level.toUpperCase(), ": ").concat(message);
});
var fileRotateTransport = new transports.DailyRotateFile({
    filename: '%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
});
var logger = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(timestamp(), customFormat),
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
    logger.add(new transports.Console({
        format: combine(timestamp(), customFormat),
    }));
}
exports.default = logger;
//# sourceMappingURL=logger.js.map