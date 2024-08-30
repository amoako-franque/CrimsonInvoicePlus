const express = require("express")
const {
	register,
	login,
	verifyUserAccount,
	resendVerificationToken,
	logout,
	generateNewAccessToken,
} = require("../controllers/authController")
const { loginLimiter } = require("../middlewares/reqLimitter")
const authRouter = express.Router()

authRouter.post("/auth/register", register)
authRouter.post("/auth/login", loginLimiter, login)
authRouter.post("/auth/logout", logout)
authRouter.get("/auth/account-verification/:token/:userId", verifyUserAccount)
authRouter.post("/auth/verification-token", resendVerificationToken)
authRouter.post("/auth/access-token", generateNewAccessToken)

module.exports = authRouter
