const crypto = require("crypto")
const mongoose = require("mongoose")
const validator = require("validator")

const Schema = mongoose.Schema

const customerSchema = new Schema(
	{
		addedBy: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			lowercase: true,
			unique: true,
			validate: [
				validator.isEmail,
				"A customer must have a valid email address",
			],
		},
		accountNo: String,
		vatTinNo: {
			type: Number,
			default: 0,
		},
		address: String,
		city: String,
		country: String,
		phoneNumber: {
			type: String,
			required: true,
			trim: true,
			max: 15,
			min: 10,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
)

customerSchema.pre("save", async function (next) {
	this.accountNo = `CUS-${crypto.randomBytes(3).toString("hex").toUpperCase()}`

	next()
})

customerSchema.set("toJSON", {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	},
})

const Customer = mongoose.model("Customer", customerSchema)

module.exports = Customer
