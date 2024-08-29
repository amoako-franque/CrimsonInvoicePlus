const mongoose = require("mongoose")
const validator = require("validator")

const userSchema = new mongoose.Schema(
	{
		firstname: {
			type: String,
			required: true,
			trim: true,
			validate: [
				validator.isAlphanumeric,
				"First Name must only contain letters and numbers and it is required",
			],
		},
		lastname: {
			type: String,
			required: true,
			trim: true,
			validate: [
				validator.isAlphanumeric,
				"Last Name must only contain letters and numbers and it is required",
			],
		},
		username: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			unique: true,
			lowercase: true,
			validate: [validator.isEmail, "Please provide a valid email"],
		},
		password: {
			type: String,
			required: true,
			trim: true,
			minlength: 8,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		googleID: String,
		roles: {
			type: [String],
			default: ["User"],
			enum: ["User", "Admin"],
		},
		avatar: String,
		phoneNumber: String,
		businessName: String,
		address: String,
		city: String,
		country: String,
		active: {
			type: Boolean,
			default: true,
		},
		passwordChangedAt: Date,
		refreshToken: [String],
	},
	{ timestamps: true }
)

const User = mongoose.model("user", userSchema)
module.exports = User
