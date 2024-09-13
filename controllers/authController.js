const expressAsyncHandler = require("express-async-handler")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const User = require("../models/userModel")
const Verification = require("../models/verificationModel")
const sendEmail = require("../utils/sendMail")
const {
	createRefreshToken,
	createAccessToken,
} = require("../utils/generateTokens")
const domain_url = process.env.DOMAIN_URL
const client_domain_url = process.env.CLIENT_DOMAIN_URL

exports.register = expressAsyncHandler(async (req, res, next) => {
	const { username, email, password, firstname, lastname } = req.body

	// validation
	if (!username || !email || !password || !firstname || !lastname) {
		res.status(400)
		throw new Error("Please add all fields")
		return false
	}

	if (password && password.length < 6) {
		res.status(400)
		throw new Error("Password must be at least 6 characters")
		return false
	}

	// check if user exists
	const existingUser = await User.findOne({ email }).lean()

	if (existingUser) {
		res.status(400)
		throw new Error(
			"The email address you've entered is linked to another account"
		)
		return false
	}

	const salt = await bcrypt.genSalt(10)
	const hashedPassword = await bcrypt.hash(password, salt)

	const user = await User.create({
		username,
		email,
		password: hashedPassword,
		firstname,
		lastname,
	})

	if (!user) {
		res.status(400)
		throw new Error("Invalid user data. Please ty again ")
		return false
	}

	const verification_token = crypto.randomBytes(32).toString("hex")

	const email_verification_token = await Verification.create({
		userId: user.id,
		token: verification_token,
	})

	const emailLink = `${domain_url}/api/v1/auth/account-verification/${email_verification_token.token}/${user.id}`

	const payload = {
		name: user.firstname,
		link: emailLink,
	}
	try {
		await sendEmail(
			user.email,
			"Account Verification",
			payload,
			"./emails/template/accountVerification.handlebars"
		)

		res.status(201).json({
			success: true,
			message: `Account created. A Verification email has been sent to your email. Please click on the verification link to verify your account.
                Verification link expires within 15 minutes`,
		})
	} catch (error) {
		next(error)
	}
})

exports.login = expressAsyncHandler(async (req, res, next) => {
	const { email, password } = req.body

	if (!email || !password) {
		res.status(400)
		throw new Error("Please provide an email and password")
	}

	const user = await User.findOne({ email }).select("+password")

	if (!user) {
		return res.status(400).json({ message: "Invalid user credentials" })
	}

	if (!user.isVerified) {
		res.status(400)
		throw new Error(
			"You have not verified your account yet. Please check your email, a verification email with a link to verify your account. Check your spam folder as well"
		)
	}

	if (!user.active) {
		res.status(400)
		throw new Error(
			"Your account have been deactivated by the admin and login is impossible. Contact admin or support team."
		)
	}

	try {
		const isMatch = await bcrypt.compare(password, user.password)

		if (!isMatch) {
			return res.status(400).json({ error: "Invalid user credentials" })
		}

		const accessToken = createAccessToken({ id: user._id, roles: user.roles })

		const newRefreshToken = createRefreshToken({ id: user._id })

		const cookies = req.cookies

		let newRefreshTokenArray = !cookies?._iu_token
			? user.refreshToken
			: user.refreshToken.filter((refT) => refT !== cookies._iu_token)

		if (cookies?._iu_token) {
			const refreshToken = cookies._iu_token
			const existingRefreshToken = await User.findOne({
				refreshToken,
				email,
			}).exec()

			if (!existingRefreshToken) {
				newRefreshTokenArray = []
			}

			const options = {
				httpOnly: true,
				maxAge: 24 * 60 * 60 * 1000,
				secure: true,
				sameSite: "None",
			}

			res.clearCookie("_iu_token", options)
		}

		user.refreshToken = [...newRefreshTokenArray, newRefreshToken]
		await user.save()

		const options = {
			httpOnly: true,
			maxAge: 24 * 60 * 60 * 1000,
			secure: true,
			sameSite: "None",
		}

		res.cookie("_iu_token", newRefreshToken, options)

		res.status(200).json({
			success: true,
			firstname: user.firstname,
			lastname: user.lastname,
			username: user.username,
			provider: user.provider,
			avatar: user?.avatar || "",
			accessToken,
		})
	} catch (error) {
		next(error)
	}
})
/**
 * Generates a new access token and refresh token for an authenticated user.
 * Verifies the provided refresh token, and if valid, creates a new access token and refresh token.
 * If the refresh token is invalid or the user is not found, it clears the refresh token cookie and sends an appropriate response.
 * If successful, it sends the new access token, refresh token, and user information in the response.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the operation is complete.
 */
exports.newAccessToken = expressAsyncHandler(async (req, res, next) => {
	const cookies = req.cookies

	if (!cookies?._iu_token) {
		return res.sendStatus(401)
	}

	const refreshToken = cookies._iu_token

	const options = {
		httpOnly: true,
		maxAge: 24 * 60 * 60 * 1000,
		secure: true,
		sameSite: "None",
	}
	res.clearCookie("_iu_token", options)

	const user = await User.findOne({ refreshToken }).exec()

	if (!user) {
		jwt.verify(
			refreshToken,
			process.env.JWT_REFRESH_SECRET_KEY,
			async (err, decoded) => {
				if (err) {
					return res.sendStatus(403)
				}
				const hackedUser = await User.findOne({
					_id: decoded.id,
				}).exec()
				hackedUser.refreshToken = []
				await hackedUser.save()
			}
		)
		return res.sendStatus(403)
	}

	const newRefreshTokenArray = user.refreshToken.filter(
		(refT) => refT !== refreshToken
	)

	jwt.verify(
		refreshToken,
		process.env.JWT_REFRESH_SECRET_KEY,
		async (err, decoded) => {
			if (err) {
				user.refreshToken = [...newRefreshTokenArray]
				await user.save()
			}

			if (err || user._id.toString() !== decoded.id) {
				return res.sendStatus(403)
			}

			const accessToken = createAccessToken({ id: user._id, roles: user.roles })

			const newRefreshToken = createRefreshToken({ id: user._id })

			user.refreshToken = [...newRefreshTokenArray, newRefreshToken]
			await user.save()

			const options = {
				httpOnly: true,
				maxAge: 24 * 60 * 60 * 1000,
				secure: true,
				sameSite: "None",
			}

			res.cookie("_iu_token", newRefreshToken, options)
			res.json({
				success: true,
				firstname: user.firstname,
				lastname: user.lastname,
				username: user.username,
				provider: user.provider,
				avatar: user.avatar,
				accessToken,
			})
		}
	)
})

exports.accountVerification = expressAsyncHandler(async (req, res, next) => {
	const { token, userId } = req.params

	const user = await User.findById(userId)

	if (!user) {
		res.status(400)
		throw new Error("We were unable to find a user for this token")
	}

	if (user.isVerified) {
		res
			.status(400)
			.send(" Account verified already. Please login with your credentials ")
		return false
	}

	const userToken = await Verification.findOne({
		userId: user.id,
		token,
	})

	if (!userToken) {
		res.status(400)
		throw new Error("Token invalid! Your token may have expired")
	}

	user.isVerified = true
	await user.save()

	if (user.isVerified) {
		const emailLink = `${client_domain_url}/login`

		const payload = {
			name: user.firstname,
			link: emailLink,
		}

		await sendEmail(
			user.email,
			`Welcome ${user.firstname} - Account Verified`,
			payload,
			"./emails/template/welcome.handlebars"
		)

		res.redirect(`${client_domain_url}/auth/verify`)
	}
})

exports.generateVerificationToken = expressAsyncHandler(
	async (req, res, next) => {
		const { email } = req.body

		if (!email) {
			res.status(400)
			throw new Error("An email must be provided")
		}

		const user = await User.findOne({ email })

		if (!user) {
			res.status(400)
			throw new Error("We were unable to find a user with that email address")
		}

		if (user.isVerified) {
			res.status(400)
			throw new Error(
				"This account has already been verified. Please login with your credentials"
			)
		}

		let verificationToken = await Verification.findOne({
			userId: user._id,
		})

		if (verificationToken) {
			await verificationToken.deleteOne()
			// await VerificationToken.deleteOne()
		}

		const new_verification_token = crypto.randomBytes(32).toString("hex")

		const emailToken = await Verification.create({
			userId: user.id,
			token: new_verification_token,
		})

		const emailLink = `${domain_url}/api/v1/auth/account-verification/${emailToken.token}/${user.id}`

		const payload = {
			name: user.firstname,
			link: emailLink,
		}

		await sendEmail(
			user.email,
			"Account Verification",
			payload,
			"./emails/template/accountVerification.handlebars"
		)

		res.status(200).json({
			success: true,
			message: `${user.firstname}, an email has been sent to your email, please click on the link to verify your account. Verification link expires within 15 minutes`,
		})
	}
)

exports.logout = expressAsyncHandler(async (req, res) => {
	const cookies = req?.cookies

	if (!cookies?._iu_token) {
		res.sendStatus(204)
		throw new Error("No cookie found")
	}

	const refreshToken = cookies._iu_token

	const user = await User.findOne({ refreshToken })
	if (!user) {
		res.clearCookie("_iu_token", {
			httpOnly: true,
			secure: true,
			sameSite: "None",
		})
		res.sendStatus(204)
	}

	user.refreshToken = user.refreshToken.filter((tk) => tk !== refreshToken)
	await user.save()

	res.clearCookie("_iu_token", {
		httpOnly: true,
		secure: true,
		sameSite: "None",
	})

	res.status(200).json({
		success: true,
		message: `${user.firstname},you have been logged out successfully`,
	})
})

exports.forgotPassword = expressAsyncHandler(async (req, res, next) => {
	const { email } = req.body

	if (!email) {
		res.status(400)
		throw new Error("You must enter your email address")
	}

	const user = await User.findOne({ email }).exec()

	if (!user) {
		res.status(400)
		throw new Error("That email is not associated with any account")
	}

	let verificationToken = await Verification.findOne({
		userId: user._id,
	})

	if (verificationToken) {
		await verificationToken.deleteOne()
	}

	const resetToken = crypto.randomBytes(32).toString("hex")

	const newVerificationToken = await Verification.create({
		userId: user._id,
		token: resetToken,
		createdAt: Date.now(),
	})

	if (user && user.isVerified) {
		const emailLink = `${client_domain_url}/auth/reset-password?emailToken=${newVerificationToken.token}&userId=${user._id}`

		const payload = {
			name: user.firstname,
			link: emailLink,
		}

		await sendEmail(
			user.email,
			"Password Reset Request",
			payload,
			"./emails/template/requestResetPassword.handlebars"
		)

		res.status(200).json({
			success: true,
			message: `Hey ${user.firstname}, an email has been sent to your account with steps to follow to reset your password.`,
		})
	}
})

exports.resetPassword = expressAsyncHandler(async (req, res, next) => {
	const { password, userId, emailToken } = req.body

	if (!password || password.length <= 8) {
		res.status(400)
		throw new Error(
			"Password must be at least 8 characters long, with at least 1 uppercase and lowercase letters and at least 1 symbol"
		)
	}

	const passwordResetToken = await Verification.findOne({ userId })

	if (!passwordResetToken) {
		res.status(400)
		throw new Error(
			"Your token is either invalid or expired. Try resetting your password again"
		)
	}

	const user = await User.findById({ _id: passwordResetToken.userId })

	if (user && passwordResetToken) {
		const salt = await bcrypt.genSalt(10)
		const hashedPassword = await bcrypt.hash(password, salt)
		user.password = hashedPassword
		await user.save()

		const payload = {
			name: user.firstname,
		}

		await sendEmail(
			user.email,
			"Password Reset Success",
			payload,
			"./emails/template/resetPassword.handlebars"
		)

		res.json({
			success: true,
			message: `Hey ${user.firstname},Your password reset was successful. An email has been sent to confirm the successful completion of your password reset process`,
		})
	}
})

exports.googleLogin = expressAsyncHandler(async (req, res, next) => {
	const existingUser = await User.findById(req.user.id)

	const payload = {
		id: req.user.id,
		roles: existingUser.roles,
		firstname: existingUser.firstname,
		lastname: existingUser.lastname,
		username: existingUser.username,
		provider: existingUser.provider,
		avatar: existingUser.avatar,
	}

	jwt.sign(
		payload,
		process.env.JWT_ACCESS_SECRET_KEY,
		{ expiresIn: "20m" },
		(err, token) => {
			const _iu_token = `${token}`

			const embedJWT = `
                    <html>
                        <script>
                        window.localStorage.setItem("googleToken",'${_iu_token}')
                        window.location.href='http://localhost:3000/dashboard'
                        </script>
                    </html>
                    `
			res.send(embedJWT)
		}
	)
})
