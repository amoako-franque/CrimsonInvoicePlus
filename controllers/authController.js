const expressAsyncHandler = require("express-async-handler")
const User = require("../models/userModel")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const Verification = require("../models/verificationModel")
const sendMail = require("../utils/sendMail")

const register = expressAsyncHandler(async (req, res, next) => {
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
	const existingUser = await User.find({ email })

	if (existingUser) {
		res.status(400)
		throw new Error("Account is linked with email provided. Please login")
		return false
	}

	// generate salt and hash user password before creating a user
	const salt = bcrypt.genSaltSync(10)
	const hashedPassword = bcrypt.hash(password, salt)

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

	const verificationToken = crypto.randomBytes(15).toString("hex")

	const userVerificationToken = await Verification.create({
		userId: user.id,
		token: verificationToken,
	})

	// send email to user
	const verifyLink = `http://localhost:4789/api/v1/verify/${verificationToken}/${user.id}`

	const payload = {
		firstname: user.firstname,
		link: verifyLink,
	}

	// try to send the email

	try {
		sendMail(user.email, "Account Verification", payload, "")
	} catch (error) {}
})
// const register = expressAsyncHandler(async (req, res, next) => {})
// const register = expressAsyncHandler(async (req, res, next) => {})
// const register = expressAsyncHandler(async (req, res, next) => {})
// const register = expressAsyncHandler(async (req, res, next) => {})
// const register = expressAsyncHandler(async (req, res, next) => {})
