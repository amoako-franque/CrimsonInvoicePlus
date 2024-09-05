const crypto = require("crypto")
const jwt = require("jsonwebtoken")

const generateVerifyToken = () => {
	return crypto.randomBytes(15).toString("hex")
}

const generateAccessToken = ({ id, roles }) => {
	const token = jwt.sign({ id, roles }, process.env.JWT_ACCESS_SECRET_KEY, {
		expiresIn: "7d",
	})

	return token
}

const generateRefreshToken = ({ id }) => {
	const token = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET_KEY, {
		expiresIn: "7d",
	})

	return token
}

module.exports = {
	generateVerifyToken,
	generateRefreshToken,
	generateAccessToken,
}
