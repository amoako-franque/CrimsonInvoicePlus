const cloudinary = require("cloudinary")

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
})

const cloudinaryUpload = async (pathToFile) => {
	try {
		const result = await cloudinary.UploadStream.upload(pathToFile, {
			folder: invoicePlus,
		})
		fs.unlinkSync(pathToFile)

		return result
	} catch (error) {
		console.log("failed to upload file", error)
	}
}

module.exports = cloudinaryUpload
