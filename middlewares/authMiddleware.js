const expressAsyncHandler = require("express-async-handler")
const User = require("../models/userModel")
const jwt = require("jsonwebtoken")

const requireSignIn = expressAsyncHandler(async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization || req.headers.authorization

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				message: "Unauthorized. Invalid access token. Login to continue",
			})
		}

		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.split(" ")[1]
			jwt.verify(
				token,
				process.env.JWT_ACCESS_SECRET_KEY,
				async (err, userInfo) => {
					if (err) return res.sendStatus({ err })
					const userId = userInfo.id

					const user = await User.findById(userId)
					if (!user) {
						return res.status(404).json({
							message: "User not found",
						})
					}

					req.auth = user
					next()
				}
			)
		} else {
			return res.status(401).json({
				message: "Unauthorized. Invalid access token. Login to continue",
			})
		}
	} catch (error) {
		console.log({ err: error.message })
		res.status(500).json({ message: "internal server error" })
		return
	}
})

// check user roles `

const isAdmin = expressAsyncHandler(async (req, res, next) => {
	const roles = req?.auth?.roles

	if (roles.includes("Admin")) {
		next()
	} else {
		res.status(403).json({ message: "Unauthorized. Admin access only" })
		return
	}
})

module.exports = { requireSignIn, isAdmin }
