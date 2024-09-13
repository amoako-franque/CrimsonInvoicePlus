const express = require("express")
const Verification = require("../models/verificationModel")
const verificationRouter = express.Router()

verificationRouter.get("/verification/tokens", async (req, res) => {
	const tokens = await Verification.find()
	res.send(tokens)
})

module.exports = verificationRouter
