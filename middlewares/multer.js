const fs = require("fs")
const multer = require("multer")
const path = require("path")

if (!fs.existsSync("./uploads")) {
	fs.mkdirSync("./uploads")
}

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./uploads")
	},
	filename: function (req, file, cb) {
		cb(
			null,
			`${file.originalname.split(".")[0]}-${Date.now()}${path.extname(
				file.originalname
			)}`
		)
	},
})

const checkImageType = (file, cb) => {
	const filetypes = /jpeg|jpg|png/
	const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

	const mimetype = filetypes.test(file.mimetype)

	if (extname && mimetype) {
		return cb(null, true)
	} else {
		cb(
			new Error(
				"Unsupported file format. You can only upload jpeg, jpg and png files."
			),
			false
		)
	}
}

const upload = multer({
	storage,
	limit: { fileSize: 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		let ext = path.extname(file.originalname)
		if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
			cb(new Error("File uploaded is not supported"), false)
			return
		}
		cb(null, true)
	},
})

module.exports = upload
