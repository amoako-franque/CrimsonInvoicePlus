const express = require("express")
const {
	register,
	login,
	accountVerification,
	generateVerificationToken,
	newAccessToken,
	forgotPassword,
	resetPassword,
	logout,
} = require("../controllers/authController")
const { loginLimiter } = require("../middlewares/reqLimiter")
const authRouter = express.Router()

authRouter.post("/auth/register", register)
authRouter.post("/auth/login", loginLimiter, login)
authRouter.get("/auth/logout", logout)
authRouter.get("/auth/account-verification/:token/:userId", accountVerification)
authRouter.post("/auth/verification-token", generateVerificationToken)
authRouter.get("/auth/access-token", newAccessToken)
authRouter.post("/auth/forgot-password", forgotPassword)
authRouter.post("auth/reset-password", resetPassword)

module.exports = authRouter
