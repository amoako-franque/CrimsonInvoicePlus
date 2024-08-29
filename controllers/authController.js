const expressAsyncHandler = require("express-async-handler")
const User = require("../models/userModel")
const bcrypt = require("bcrypt")
const Verification = require("../models/verificationModel")
const sendMail = require("../utils/sendMail")
const {
	generateVerifyToken,
	generateAccessToken,
} = require("../utils/generateTokens")

exports.register = expressAsyncHandler(async (req, res, next) => {
	const { username, email, password, firstname, lastname } = req.body

	// validate user inputs
	if (!username || !email || !password || !firstname || !lastname) {
		res.status(400)
		throw new Error("Please fill all fields")
		return false
	}

	// validate password
	if (password && password.length < 8) {
		res.status(400)
		throw new Error("Password must be at least 8 characters")
		return false
	}

	// check if user exists/ account is linked to user's email
	const existingUser = await User.findOne({ email })

	if (existingUser) {
		res.status(400)
		throw new Error("Account is linked with email provided. Please login")
		return false
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
		return false
	}

	const token = generateVerifyToken()
	await Verification.create({
		userId: user.id,
		token,
	})

	// send email to user
	const verifyLink = `http://localhost:4789/api/v1/auth/verify/${token}/${user.id}`

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
//

// accountRouter.post("/verify/:token/:userId")
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

	const verificationToken = await Verification.findOne({ userId })

	if (!verificationToken) {
		res.status(400).send("Verification token not found")
		return
	}

	user.isVerified = true
	await user.save()

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
			return false
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

// const register = expressAsyncHandler(async (req, res, next) => {})
// const register = expressAsyncHandler(async (req, res, next) => {})
// const register = expressAsyncHandler(async (req, res, next) => {})
// const register = expressAsyncHandler(async (req, res, next) => {})
