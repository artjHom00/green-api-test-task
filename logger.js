const winston = require("winston");

const logger = winston.createLogger({
  level: 'silly',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "warn" }),
    new winston.transports.File({ filename: "app.log" }),
  ],
});

module.exports = logger