const nodemailer = require("nodemailer")
const handlebars = require("handlebars")
const fs = require("fs")
const path = require("path")
const { systemLogs } = require("../middlewares/logger")
const sendMail = async (email, subject, payload, template) => {
	const pathToEmailTemplate = fs.readFileSync(
		path.join(__dirname, template),
		"utf8"
	)

	const compiledTemplate = handlebars.compile(pathToEmailTemplate)

	const options = {
		from: process.env.SENDER_EMAIL,
		to: email,
		subject: subject,
		html: compiledTemplate(payload),
	}
	// option one using mailtrap
	// const mailTransport = nodemailer.createTransport({
	// 	host: process.env.MAIL_HOST,
	// 	port: process.env.MAIL_PORT,
	// 	secure: false,
	// 	auth: {
	// 		user: process.env.MAIL_USER,
	// 		pass: process.env.MAIL_PASSWORD,
	// 	},
	// })

	// mailTransport.sendMail(options, (error, info) => {
	// 	if (error) {
	// 		return systemLogs.error(`Email was not sent: ${error}`)
	// 	}

	// 	return systemLogs.info(`Email sent: ${info.response}`)
	// })

	// option two nodemailer
	let transportmail = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.USER_MAIL_ID,
			pass: process.env.USER_SECRET,
		},
	})

	transportmail.sendMail(options, function (err, res) {
		if (err) {
			console.log(err)
		} else {
			console.log("Email sent successfully")
		}
	})
}

module.exports = sendMail
