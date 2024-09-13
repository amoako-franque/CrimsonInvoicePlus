const expressAsyncHandler = require("express-async-handler")
const User = require("../models/userModel")

exports.fetchProfile = expressAsyncHandler(async (req, res) => {
	const userId = req.auth.id

	const user = await User.findById(userId, {
		refreshToken: 0,
		roles: 0,
		_id: 0,
	}).lean()

	if (!user) {
		res.status(204)
		throw new Error("user profile not found")
	}

	res.status(200).json({
		success: true,
		user,
	})
})

exports.fetchAllUsers = expressAsyncHandler(async (req, res) => {
	const pageSize = 10

	const page = Number(req.query.pageNumber) || 1

	const count = await User.countDocuments({})

	const users = await User.find()
		.sort({ createdAt: -1 })
		.select("-refreshToken")
		.limit(pageSize)
		.skip(pageSize * (page - 1))
		.lean()

	res.status(200).json({
		success: true,
		count,
		numberOfPages: Math.ceil(count / pageSize),
		users,
	})
})

exports.updateUserProfile = expressAsyncHandler(async (req, res) => {
	const userId = req.auth.id

	const { password, email, isVerified, provider, roles, googleID } = req.body

	const user = await User.findById(userId)

	if (!user) {
		res.status(400)
		throw new Error("That user does not exist in our system")
	}

	if (password) {
		res.status(400)
		throw new Error(
			"This route is not for password updates. Please use the password reset functionality instead"
		)
	}

	if (email || isVerified || provider || roles || googleID) {
		res.status(400)
		throw new Error("You are not allowed to update that field on this route")
	}

	const updatedProfile = await User.findByIdAndUpdate(
		userId,
		{
			firstname: req.body.firstname || user.firstname,
			lastname: req.body.lastname || user.lastname,
			username: req.body.username || user.username,
			businessName: req.body.businessName || user.businessName,
			phoneNumber: req.body.phoneNumber || user.phoneNumber,
			address: req.body.address || user.address,
			country: req.body.country || user.country,
			city: req.body.city || user.city,
			avatar: req.body.avatar || user.avatar,
		},
		{ new: true, runValidators: true }
	).select("-refreshToken")

	res.status(200).json({
		success: true,
		message: `${user.firstname}, your profile was successfully updated`,
		updatedProfile,
	})
})

exports.deleteMyAccount = expressAsyncHandler(async (req, res, next) => {
	const userId = req.auth.id

	if (userId?.toString() !== req.params.id?.toString()) {
		res.status(400)
		throw new Error("You are not allowed to delete this account")
	}

	try {
		const user = await User.findByIdAndDelete({ _id: userId })

		res.json({
			success: true,
			message: `You have deleted your account successfully. Sad to see you go ${user.username}`,
		})
	} catch (error) {
		next(error)
	}
})

// by admin
exports.deleteAccount = expressAsyncHandler(async (req, res, next) => {
	const userId = req.params.id

	if (!userId) {
		res.status(400)
		throw new Error("You must provide a parameter")
	}

	try {
		const user = await User.findByIdAndDelete({ _id: userId })

		res.json({
			success: true,
			message: `Account with username ${user.username} deleted successfully`,
		})
	} catch (error) {
		next(error)
	}
})

exports.deactivateUser = expressAsyncHandler(async (req, res, next) => {
	const userId = req.params.id

	const user = await User.findById(userId)

	if (!user) {
		res.status(400)
		throw new Error("User not found")
	}

	if (user.active) {
		const user = await User.findByIdAndUpdate(
			userId,
			{ active: false },
			{ new: true }
		)

		return res
			.status(200)
			.json({ success: true, message: "User deactivated", user })
	} else {
		const user = await User.findByIdAndUpdate(
			userId,
			{ active: true },
			{ new: true }
		)

		return res
			.status(200)
			.json({ success: true, message: "User deactivated", user })
	}
})

exports.updateUserRole = expressAsyncHandler(async (req, res, next) => {
	const userId = req.params.id
	const role = req.body.role

	const roles = ["Admin", "User"]

	if (!role || !roles.includes(role)) {
		res.status(400)
		throw new Error("Please provide a valid role")
	}

	try {
		const user = await User.findByIdAndUpdate(
			userId,
			{ roles: req.body.role },
			{ new: true }
		)

		res.status(200).json({ user })
	} catch (error) {
		next(error)
	}
})




































