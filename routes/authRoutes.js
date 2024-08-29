const express = require("express")
const {
	register,
	login,
	verifyUserAccount,
} = require("../controllers/authController")
const { loginLimiter } = require("../middlewares/reqLimitter")
const authRouter = express.Router()

authRouter.post("/auth/register", register)
authRouter.post("/auth/login", loginLimiter, login)
authRouter.get("/auth/verify/:token/:userId", verifyUserAccount)

module.exports = authRouter
