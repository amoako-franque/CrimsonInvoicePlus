const crypto = require("crypto")
const mongoose = require("mongoose")

const Schema = mongoose.Schema

const paymentSchema = new Schema(
	{
		paidBy: String,
		datePaid: String,
		amountPaid: Number,
		paymentMethod: {
			type: String,
			default: "Cash",
			enum: [
				"Cash",
				"Mobile Money",
				"Cheque",
				"Credit Card",
				"Bank Transfer",
				"Others",
			],
		},
		additionalInfo: String,
	},
	{
		timestamps: true,
	}
)

const documentSchema = new Schema(
	{
		addedBy: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		customer: {
			name: String,
			email: String,
			accountNo: String,
			vatTinNo: String,
			address: String,
			city: String,
			country: String,
			phoneNumber: String,
		},
		documentType: {
			type: String,
			default: "Invoice",
			enum: ["Invoice", "Receipt", "Quotation"],
		},
		documentNumber: String,
		dueDate: Date,
		additionalInfo: String,
		termsConditions: String,
		status: {
			type: String,
			default: "Not Paid",
			enum: ["Paid", "Not Fully Paid", "Not Paid"],
		},
		subTotal: Number,
		salesTax: Number,
		rates: String,
		total: Number,
		currency: String,
		totalAmountReceived: Number,
		billingItems: [
			{
				itemName: String,
				unitPrice: Number,
				quantity: Number,
				discount: String,
			},
		],
		paymentRecords: [paymentSchema],
	},
	{
		timestamps: true,
	}
)

documentSchema.pre("save", async function (next) {
	this.documentNumber = `${new Date().getFullYear()}-${new Date().toLocaleString(
		"default",
		{ month: "long" }
	)}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`
	next()
})

documentSchema.set("toJSON", {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	},
})

const Document = mongoose.model("Document", documentSchema)

module.exports = Document
