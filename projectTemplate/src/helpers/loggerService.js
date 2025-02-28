const winston = require('winston');
const { combine, timestamp, json } = require('winston').format;
let myEnvDir;

if (process.env.ENVIRONMENT == 'local') {
	myEnvDir = 'local';
} else if (process.env.ENVIRONMENT == 'PRODUCTION') {
	myEnvDir = 'production';
} else {
	myEnvDir = 'dev';
}

const allLogFilePath = `./logger/${myEnvDir}/all-logs.log`;
const exceptionsLogPath = `./logger/${myEnvDir}/exceptions.log`;

const logger = winston.createLogger({
	transports: [
		new winston.transports.File({
			level: 'info',
			filename: allLogFilePath,
			handleExceptions: true,
			json: true,
			maxsize: 5242880, // 5MB
			maxFiles: 5, // if log file size is greater than 5MB, logfile2 is generated
			colorize: true,
			timestamp: true,
			format: combine(timestamp(), json()),
			prettyPrint: true
		}),
		new winston.transports.Console({
			level: 'debug',
			handleExceptions: true,
			json: true,
			colorize: true,
			timestamp: true,
			format: winston.format.cli(),
			prettyPrint: true
		}),
	],
	exceptionHandlers: [
		new winston.transports.File({
			filename: exceptionsLogPath,
			timestamp: true,
			maxsize: 5242880,
			json: true,
			colorize: true,
			format: combine(timestamp(), json())
		}),
	],
	exitOnError: false,
});

module.exports = {
	logger: logger
};