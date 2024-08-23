const rateLimit = require("express-rate-limit")

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	message: "Too many requests from this IP, please try again after 15 minutes",
	handler: (req, res, next, options) => {
		systemLogs.error(
			`Too many requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`
		)
		res.status(options.statusCode).json({
			message: options.message,
		})
	},
	standardHeaders: true,
	legacyHeaders: false,
})
const loginLimiter = rateLimit({
	windowMs: 30 * 60 * 1000,
	max: 5,
	message: "Too many requests from this IP, please try again after 30 minutes",
	handler: (req, res, next, options) => {
		systemLogs.error(
			`Too many login requests fron this IP address. Please try again later: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`
		)
		res.status(options.statusCode).json({
			message: options.message,
		})
	},
	standardHeaders: true,
	legacyHeaders: false,
})

module.exports = { apiLimiter, loginLimiter }
