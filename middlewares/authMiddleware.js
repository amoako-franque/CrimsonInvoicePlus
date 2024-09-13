const asyncHandler = require("express-async-handler")
const jwt = require("jsonwebtoken")
const User = require("../models/userModel")

const access_token = process.env.JWT_ACCESS_SECRET_KEY

const requireSignIn = asyncHandler(async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization || req.headers.Authorization
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res
				.status(401)
				.json({ message: "Invalid token. Login to continue..." })
		}

		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.split(" ")[1] // Bearer token
			jwt.verify(token, access_token, async (err, decoded) => {
				if (err) return res.sendStatus(403)

				const userId = decoded.id
				const user = await User.findById(userId)
				if (!user) {
					return res.status(401).json({ message: "User not found" })
				}

				req.auth = user
				next()
			})
		} else {
			return res
				.status(401)
				.json({ message: "Invalid token. Login to continue" })
		}
	} catch (error) {
		console.error(error)
		return res.status(500).json({ message: "Internal server error" })
	}
})

// check user roles

const isAdmin = asyncHandler(async (req, res, next) => {
	const roles = req?.auth?.roles

	if (!roles.includes("Admin")) {
		return res
			.status(401)
			.json({ message: "You are not authorized to perform this action" })
	}

	next()
})

module.exports = { requireSignIn, isAdmin }
