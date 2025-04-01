// config/logger.js (or utils/logger.js)
const winston = require('winston');
const path = require('path');

// Define the log file path
const logFilePath = path.join(__dirname, '..', 'logs','error.log');  // Adjust this path as needed
console.log('Log file path:', logFilePath);

// Create and configure the logger
const logger = winston.createLogger({
    level: 'error', // Log only error level and above
    format: winston.format.combine(
        winston.format.timestamp(), // Add timestamp to each log entry
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: logFilePath, level: 'error' }), // Log errors to a file
        new winston.transports.Console({ format: winston.format.simple() }) // Optionally log to the console
    ],
});

module.exports = logger;
