const mongoose = require("mongoose")

const Schema = mongoose.Schema

const verificationSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: "User",
	},
	token: { type: String, required: true },
	createdAt: {
		type: Date,
		required: true,
		default: Date.now,
		expires: 900,
	},
})

verificationSchema.set("toJSON", {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString()
		delete returnedObject._id
		delete returnedObject.__v
	},
})

const Verification = mongoose.model("Verification", verificationSchema)

module.exports = Verification
