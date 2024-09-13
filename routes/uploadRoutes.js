const express = require("express")
const cloudinaryUploader = require("../config/cloudinaryConfig")
const upload = require("../middlewares/multer")
const uploadRouter = express.Router()

uploadRouter.put(
	"/upload/document",
	upload.single("logo"),
	async (req, res, next) => {
		const localFilePath = req.file.path

		try {
			const result = await cloudinaryUploader(localFilePath)
			res.send(result)
		} catch (error) {
			next(error)
		}
	}
)

module.exports = uploadRouter
