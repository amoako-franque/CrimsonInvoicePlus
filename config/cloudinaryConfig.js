const cloudinary = require("cloudinary").v2
const fs = require("fs")

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
})

const cloudinaryUploader = async (localFilePath) => {
	const invoice_folder = "local-store-invoice"

	// const filePathOnCloudinary = invoice_folder + "/" + localFilePath

	try {
		const result = await cloudinary.uploader.upload(localFilePath, {
			folder: invoice_folder,
		})

		fs.unlinkSync(localFilePath)

		return result.secure_url
	} catch (error) {
		console.log("hello can not upload", error)
	}
}

module.exports = cloudinaryUploader
