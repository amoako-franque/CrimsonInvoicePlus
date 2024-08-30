const allowedOptions = require("./allowedOptions")

const corsOptions = {
	origin: (origin, cb) => {
		if (allowedOptions.indexOf(origin) !== -1 || !origin) {
			cb(null, true)
		} else {
			cb(new Error("Not allowed by CORS"))
		}
	},
	methods: ["GET", "POST", "PUT", "DELETE"],
	Credential: true,
	optionsSuccessStatus: 200,
}

module.exports = corsOptions
