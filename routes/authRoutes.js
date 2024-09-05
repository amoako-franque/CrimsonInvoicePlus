const express = require("express")
const {
	register,
	login,
	verifyUserAccount,
	resendVerificationToken,
	logout,
	generateNewAccessToken,
	forgotPassword,
	resetPassword,
} = require("../controllers/authController")
const { loginLimiter } = require("../middlewares/reqLimitter")
const authRouter = express.Router()

authRouter.post("/auth/register", register)
authRouter.post("/auth/login", loginLimiter, login)
authRouter.post("/auth/logout", logout)
authRouter.get("/auth/account-verification/:token/:userId", verifyUserAccount)
authRouter.post("/auth/verification-token", resendVerificationToken)
authRouter.get("/auth/access-token", generateNewAccessToken)
authRouter.post("/auth/forgot-password", forgotPassword)
authRouter.post("/auth/reset-password", resetPassword)

module.exports = authRouter
