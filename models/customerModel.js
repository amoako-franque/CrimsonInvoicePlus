const mongoose = require("mongoose")
const validator = require("validator")
const crypto = require("crypto")

const customerSchema = new mongoose.Schema(
	{
		addedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			unique: true,
			lowercase: true,
			validate: [validator.isEmail, "Please enter an email for the customer "],
		},
		accountNo: {
			type: String,
		},
		vatTinNo: {
			type: Number,
		},
		address: String,
		city: String,
		country: String,
		phoneNumber: {
			type: String,
			required: true,
			trim: true,
			// validate: [validator.isMobilePhone, "Please enter a valid phone number"],
			unique: true,
			min: 10,
			max: 15,
		},
	},
	{ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

customerSchema.pre("save", async function (next) {
	this.accountNo = `CRIM-CUS-${crypto
		.randomBytes(4)
		.toString("hex")
		.toUpperCase()}`

	next()
})

const Customer = mongoose.model("Customer", customerSchema)
module.exports = Customer
