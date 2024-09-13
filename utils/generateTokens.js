const jwt = require("jsonwebtoken")
const crypto = require("crypto")

const createAccessToken = ({ id, roles }) => {
	const token = jwt.sign({ id, roles }, process.env.JWT_ACCESS_SECRET_KEY, {
		expiresIn: "15m",
	})

	return token
}

const createRefreshToken = ({ id }) => {
	const token = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET_KEY, {
		expiresIn: "7d",
	})
	return token
}

const generateResetToken = async (user) => {
	const resetToken = crypto.randomBytes(41).toString("hex")

	const hashedToken = crypto
		.createHash("sha256")
		.update(resetToken)
		.digest("hex")

	user.password_reset_token = hashedToken
	user.password_reset_token_expiry = Date.now() + 10 * 60 * 1000 // 10 minutes from now

	return resetToken
}

module.exports = {
	createAccessToken,
	createRefreshToken,
	generateResetToken,
}
