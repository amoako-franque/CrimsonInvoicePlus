const mongoose = require("mongoose")
const colors = require("colors")
const { systemLogs } = require("../middlewares/logger")

const mongo_uri = process.env.MONGODB_URL

const mongodbConnection = async () => {
	try {
		await mongoose.connect(mongo_uri)

		console.log("Connection to mongod established".grey)
		systemLogs.info("Connection to mongod established")
	} catch (err) {
		console.log(err)
	}
}

module.exports = mongodbConnection
