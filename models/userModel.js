const mongoose = require("mongoose")
const validator = require("validator")

const Schema = mongoose.Schema

const userSchema = new Schema(
	{
		email: {
			type: String,
			lowercase: true,
			unique: true,
			lowercase: true,
			trim: true,
			required: true,
			validate: [validator.isEmail, "Please provide a valid email"],
		},

		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			validate: {
				validator: function (value) {
					return /^[A-z][A-z0-9-_]{3,23}$/.test(value)
				},
				message:
					"username must be alphanumeric,without special characters.Hyphens and underscores allowed",
			},
		},

		firstname: {
			type: String,
			required: true,
			trim: true,
			validate: [
				validator.isAlphanumeric,
				"First Name can only have Alphanumeric values. No special characters allowed",
			],
		},

		lastname: {
			type: String,
			required: true,
			trim: true,
			validate: [
				validator.isAlphanumeric,
				"Last Name can only have Alphanumeric values. No special characters allowed",
			],
		},
		password: {
			type: String,
			select: false,
			trim: true,
			validate: [
				validator.isStrongPassword,
				"Password must be at least 8 characters long, with at least 1 uppercase and lowercase letters and at least 1 symbol",
			],
		},
		isVerified: { type: Boolean, required: true, default: false },
		provider: {
			// checks if user logged in with email or via google
			type: String,
			required: true,
			default: "email",
		},
		googleID: String,
		avatar: String,
		businessName: String,
		phoneNumber: {
			type: String,
			trim: true,
			required: true,
		},
		address: String,
		city: String,
		country: { type: String, default: "Ghana" },
		passwordChangedAt: Date,
		roles: {
			type: [String],
			default: ["User"],
			enum: ["User", "Admin"],
		},
		active: {
			type: Boolean,
			default: true,
		},
		refreshToken: [String],
	},
	{
		timestamps: true,
	}
)
userSchema.set("toJSON", {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	},
})

const User = mongoose.model("User", userSchema)

module.exports = User
