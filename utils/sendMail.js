const fs = require("fs")
const handlebars = require("handlebars")
const path = require("path")
const nodemailer = require("nodemailer")
const { systemLogs } = require("../middlewares/logger")

const sendEmail = async (email, subject, payload, template) => {
	const emailTemplateSource = fs.readFileSync(
		path.join(__dirname, template),
		"utf8"
	)

	const compiledTemplate = handlebars.compile(emailTemplateSource)

	const mailOptions = {
		from: process.env.SENDER_EMAIL,
		to: email,
		subject: subject,
		html: compiledTemplate(payload),
	}

	let transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.USER_MAIL_ID,
			pass: process.env.USER_SECRET,
		},
	})

	transporter.sendMail(mailOptions, function (err, info) {
		if (err) {
			console.log({ err })
			return systemLogs.error(`Email was not sent: ${err}`)
		} else {
			console.log({ msg: "Email sent successfully", data: info })
			systemLogs.info("Email sent: " + info.response)
			return
		}
	})
}

module.exports = sendEmail
