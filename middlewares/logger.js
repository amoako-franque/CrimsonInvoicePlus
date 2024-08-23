const morgan = require("morgan")
const { createLogger, format, transports } = require("winston")
require("winston-daily-rotate-file")

const { combine, timestamp, prettyPrint } = format

const transport = new transports.DailyRotateFile({
	filename: "logs/crimson-invoice-plus-%DATE%.log",
	dirname: "logs",
	datePattern: "YYYY-MM-DD-HH",
	zippedArchive: true,
	maxSize: "20m",
	maxFiles: "14d",
})

const systemLogs = createLogger({
	level: "http",
	format: combine(
		timestamp({
			format: "YYYY-MM-DD HH:mm:ss.SSS A",
		}),
		prettyPrint()
	),
	transports: [
		transport,
		new transports.File({
			filename: "logs/error.log",
			level: "error",
		}),
	],
	exceptionHandlers: [new transports.File({ filename: "logs/exceptions.log" })],
	rejectionHandlers: [new transports.File({ filename: "logs/rejections.log" })],
	exitOnError: false,
})

const morganMiddleware = morgan(
	function (tokens, req, res) {
		return JSON.stringify({
			method: tokens.method(req, res),
			url: tokens.url(req, res),
			status: Number.parseFloat(tokens.status(req, res)),
			contentLength: tokens.res(req, res, "content-length"),
			responseTime:
				Number.parseFloat(tokens["response-time"](req, res)) + " ms",
		})
	},
	{
		stream: {
			write: (message) => {
				const data = JSON.parse(message)
				systemLogs.http(`Incoming ${data.method} request`, data)
			},
		},
	}
)

module.exports = { systemLogs, morganMiddleware }
