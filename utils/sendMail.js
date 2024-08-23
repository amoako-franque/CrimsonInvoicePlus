const nodemailer = require("nodemailer")
const handlebars = require("handlebars")
const fs = require("fs")
const path = require("path")
const { systemLogs } = require("../middlewares/logger")
const sendMail = async (email, subject, payload, template) => {
	const transporter = nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 587,
		secure: false, // Use `true` for port 465, `false` for all other ports
		auth: {
			user: process.env.USER_MAIL_ID,
			pass: process.env.USER_SECRET,
		},
	})

	const pathToEmailTemplate = fs.readFileSync(
		path.join(__dirname, template),
		"utf8"
	)

	const compiledTemplate = handlebars.compile(pathToEmailTemplate)

	const options = {
		// crimsoninvoiceplus@support.com
		from: process.env.SENDER_EMAIL,
		to: email,
		subject: subject,
		html: compiledTemplate(payload),
	}

	await transporter.sendMail(options, (error, info) => {
		if (error) {
			return systemLogs.error(`Email was not sent: ${error}`)
		}

		return systemLogs.info(`Email sent: ${info.response}`)
	})
}

module.exports = sendMail
