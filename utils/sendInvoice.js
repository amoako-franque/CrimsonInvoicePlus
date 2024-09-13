const nodemailer = require("nodemailer")
const { systemLogs } = require("../middlewares/logger")

const sendInvoiceEmail = async (data) => {
	try {
		let transportMail = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.USER_MAIL_ID,
				pass: process.env.USER_SECRET,
			},
		})

		const options = {
			from: data.from,
			to: data.to,
			replyTo: data.replyTo,
			subject: data.subject,
			text: data.text,
			html: data.html,
			attachments: data.attachments,
		}

		transportMail.sendMail(options, function (err, info) {
			if (err) {
				console.log({ err })
				return systemLogs.error(`Email was not sent: ${err}`)
			} else {
				console.log({ msg: "Email sent successfully" })
				systemLogs.info("Email sent")
				return
			}
		})
	} catch (error) {
		console.log(error, "email not sent")
	}
}

module.exports = sendInvoiceEmail
