const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const User = require("../models/userModel")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const sendEmail = require("../utils/sendMail")

const domainURL = process.env.DOMAIN_URL

const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL

const googleAuth = () => {
	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				callbackURL: `${domainURL}/api/v1/${googleCallbackURL}`,
			},
			(accessToken, refreshToken, profile, cb) => {
				// TODO: remove this console in production

				User.findOne({ googleID: profile.id }).then((user) => {
					if (!user) {
						const name = profile.displayName.split(" ")
						const email = profile._json.email.split("@")[0]
						const password = name[1] + email

						const salt = bcrypt.genSalt(10)
						const hashedPassword = bcrypt.hash(password, salt)

						User.create({
							username: profile._json.given_name,
							firstname: name[0],
							lastname: name[1],
							password: hashedPassword,
							avatar: profile._json.picture,
							email: profile._json.email,
							googleID: profile.id,
							isVerified: profile._json.email_verified,
							provider: "google",
						})
							.then(async (user) => {
								const payload = {
									name: user.firstname,
									password: password,
								}
								await sendEmail(
									user.email,
									"Password Notice",
									payload,
									"./emails/template/passwordNotice.handlebars"
								)
								cb(null, user)
							})
							.catch((err) => {
								return cb(err, false)
							})
					} else {
						cb(null, user)
					}
				})
			}
		)
	)
}

module.exports = googleAuth
