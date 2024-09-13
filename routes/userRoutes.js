const express = require("express")
const {
	fetchAllUsers,
	fetchProfile,
	updateUserProfile,
	deleteMyAccount,
	deleteAccount,
	deactivateUser,
	updateUserRole,
} = require("../controllers/userController")
const { requireSignIn, isAdmin } = require("../middlewares/authMiddleware")
const userRouter = express.Router()

userRouter.get("/user-accounts", requireSignIn, isAdmin, fetchAllUsers)
userRouter.get("/account-profile", requireSignIn, fetchProfile)
userRouter.put("/account-profile", requireSignIn, updateUserProfile)
userRouter.patch(
	"/admin/users/:id/deactivate",
	requireSignIn,
	isAdmin,
	deactivateUser
)
userRouter.put("/users/role/:id", requireSignIn, isAdmin, updateUserRole)
userRouter.delete("/user-account/:id", requireSignIn, deleteMyAccount)
userRouter.delete("/admin/users/:id", requireSignIn, isAdmin, deleteAccount)

module.exports = userRouter
