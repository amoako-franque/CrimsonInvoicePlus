const expressAsyncHandler = require("express-async-handler")
const User = require("../models/userModel")
const bcrypt = require("bcrypt")
const Verification = require("../models/verificationModel")
const sendMail = require("../utils/sendMail")
const {
	generateVerifyToken,
	generateAccessToken,
} = require("../utils/generateTokens")
const jwt = require("jsonwebtoken")

exports.register = expressAsyncHandler(async (req, res, next) => {
	const { username, email, password, firstname, lastname } = req.body

	// validate user inputs
	if (!username || !email || !password || !firstname || !lastname) {
		res.status(400)
		throw new Error("Please fill all fields")
	}

	// validate password
	if (password && password.length < 8) {
		res.status(400)
		throw new Error("Password must be at least 8 characters")
	}

	// check if user exists/ account is linked to user's email
	const existingUser = await User.findOne({ email })

	if (existingUser) {
		res.status(400)
		throw new Error("Account is linked with email provided. Please login")
	}

	// generate salt and hash user password before creating a user
	const salt = await bcrypt.genSaltSync(10)
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
		throw new Error("Invalid user data")
	}

	const token = generateVerifyToken()
	await Verification.create({
		userId: user.id,
		token,
	})

	// send email to user
	const verifyLink = `http://localhost:4789/api/v1/auth/account-verification/${token}/${user.id}`

	const payload = {
		firstname: user.firstname,
		link: verifyLink,
	}

	// try to send the email

	try {
		await sendMail(
			user.email,
			"Account Verification",
			payload,
			"./emails/templates/accountVerification.handlebars"
		)

		res.status(201).json({
			message: "Please check your email to verify your account",
			success: true,
		})
	} catch (error) {
		console.log(error)
		next(error)
		// res.status(500)
		// throw new Error("Something went wrong. Please try again later")
	}
})

exports.verifyUserAccount = expressAsyncHandler(async (req, res, next) => {
	const { token, userId } = req.params

	const user = await User.findById(userId)

	if (!user) {
		res.status(400)
		throw new Error("User not found")
	}

	if (user.isVerified) {
		res.status(400).send("Account verified already. Please login to continue")
		return
	}

	const verificationToken = await Verification.findOne({ userId, token })

	if (!verificationToken) {
		res.status(400).send("Verification token not found")
		return
	}

	user.isVerified = true
	await user.save()

	await Verification.findByIdAndDelete({ _id: verificationToken.id })

	if (user.isVerified) {
		const emailLink = `${process.env.CLIENT_DOMAIN_URL}/login`

		const payload = {
			firstname: user.firstname,
			emailLink,
		}

		await sendMail(
			user.email,
			`Welcome ${user.firstname} - Account verified`,
			payload,
			"./emails/templates/welcome.handlebars"
		)

		res.redirect(`${process.env.CLIENT_DOMAIN_URL}/auth/verify`)
	}
})

exports.login = expressAsyncHandler(async (req, res, next) => {
	try {
		const { email, password } = req.body

		if (!email || !password) {
			res.status(400).json({ error: "Please fill all fields" })
			return
		}

		const user = await User.findOne({ email })

		if (!user) {
			res.status(400)
			throw new Error("Invalid credentials")
		}

		if (!user.isVerified) {
			res.status(400)
			throw new Error("Please verify your account")
		}

		if (!user.active) {
			res.status(400)
			throw new Error(
				"Your account has been deactivated. Please contact the Admin"
			)
		}

		const isPasswordMatched = await bcrypt.compare(password, user.password)

		if (!isPasswordMatched) {
			res.status(400)
			throw new Error("Invalid credentials")
		}

		const accessToken = generateAccessToken({ id: user.id, roles: user.roles })
		const refreshToken = generateAccessToken({ id: user.id })

		const cookies = req.cookies
		//
		let newRefreshTokenArray = !cookies?._iu_token
			? user.refreshToken
			: user.refreshToken.filter((refT) => refT !== cookies._iu_token)

		if (cookies?._iu_token) {
			const refreshToken = cookies._iu_token
			const existingRefreshToken = await User.findOne({
				refreshToken,
				email,
			})

			if (!existingRefreshToken) {
				newRefreshTokenArray = []
			}

			const options = {
				httpOnly: true,
				maxAge: 24 * 60 * 60 * 1000,
				sameSite: "none",
				secure: true,
			}

			res.clearCookie("_iu_token", options)
		}

		user.refreshToken = [...newRefreshTokenArray, refreshToken]

		await user.save()

		const options = {
			httpOnly: true,
			maxAge: 24 * 60 * 60 * 1000,
			sameSite: "none",
			secure: true,
		}

		res.cookie("_iu_token", refreshToken, options)

		res.status(200).json({
			success: true,
			message: "User logged in successfully",
			accessToken,
			user,
		})
	} catch (error) {
		next(error)
	}
})

exports.resendVerificationToken = expressAsyncHandler(
	async (req, res, next) => {
		const { email } = req.body
		if (!email) {
			res.status(400).json({ error: "Email is required." })
			return
		}

		const user = await User.findOne({ email })

		if (!user) {
			res.status(400).json({ error: "User not found." })
			return
		}

		if (user.isVerified) {
			res.status(400).json({ error: "Account is already verified." })
			return
		}

		const userToken = await Verification.findOne({ userId: user._id })

		if (userToken) {
			await userToken.deleteOne()
		}

		const token = generateVerifyToken()
		await Verification.create({
			userId: user.id,
			token,
		})

		// send email to user
		const verifyLink = `http://localhost:4789/api/v1/auth/account-verification/${token}/${user.id}`

		const payload = {
			firstname: user.firstname,
			link: verifyLink,
		}

		// try to send the email

		try {
			await sendMail(
				user.email,
				"Account Verification",
				payload,
				"./emails/templates/accountVerification.handlebars"
			)

			res.status(201).json({
				message: "Please check your email to verify your account",
				success: true,
			})
		} catch (error) {
			console.log(error)
			next(error)
			// res.status(500)
			// throw new Error("Something went wrong. Please try again later")
		}
	}
)

exports.generateNewAccessToken = expressAsyncHandler(async (req, res, next) => {
	const cookies = req.cookies

	if (!cookies?._iu_token) {
		res.status(401).json({ error: "No token found" })
		return
	}

	const refreshToken = cookies._iu_token

	const options = {
		httpOnly: true,
		maxAge: 24 * 60 * 60 * 1000,
		sameSite: "none",
		secure: true,
	}

	res.clearCookie("_iu_token", options)

	const user = await User.findOne({ refreshToken })

	if (!user) {
		jwt.verify(
			refreshToken,
			process.env.JWT_REFRESH_SECRET_KEY,
			async (err, userInfo) => {
				if (err) {
					return res.sendStatus(403)
				}
				const hackedUser = await User.findOne({ _id: userInfo.id })

				if (!hackedUser) {
					return res.sendStatus(403)
				}

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
		async (err, useInfo) => {
			if (err) {
				user.refreshToken = [...newRefreshTokenArray]
				await user.save()
				return res.sendStatus(403)
			}
			if (err || user._id.toString() !== decoded.id) {
				return res.sendStatus(403)
			}

			const accessToken = generateAccessToken({
				id: user.id,
				roles: user.roles,
			})
			const refreshToken = generateAccessToken({ id: user.id })

			user.refreshToken = [...newRefreshTokenArray, refreshToken]

			await user.save()

			const options = {
				httpOnly: true,
				maxAge: 24 * 60 * 60 * 1000,
				sameSite: "none",
				secure: true,
			}

			res.cookie("_iu_token", refreshToken, options)

			res.status(200).json({ useInfo, accessToken })
		}
	)
})

exports.logout = expressAsyncHandler(async (req, res, next) => {
	const cookies = req.cookies

	if (!cookies?._iu_token) {
		return res.status(401).json({ error: "No token found in cookie" })
	}

	const refreshToken = cookies._iu_token

	const user = await User.findOne({ refreshToken })

	if (!user) {
		res.clearCookie("_iu_token", {
			httpOnly: true,
			sameSite: "none",
			secure: true,
		})
		res.sendStatus(204)
	}

	user.refreshToken = user.refreshToken.filter((refT) => refT !== refreshToken)

	await user.save()

	res.clearCookie("_iu_token", {
		httpOnly: true,
		sameSite: "none",
		secure: true,
	})

	res.sendStatus(204).json({
		success: true,
		message: "Logged out successfully",
	})
})
// const register = expressAsyncHandler(async (req, res, next) => {})
