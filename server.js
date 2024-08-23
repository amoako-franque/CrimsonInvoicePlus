const express = require("express")
const cors = require("cors")
require("dotenv").config()
const path = require("path")
const morgan = require("morgan")
const colors = require("colors")
const cookieParser = require("cookie-parser")
const ExpressMongoSanitize = require("express-mongo-sanitize")
const corsOptions = require("./config/corsOptions")
const mongodbConnection = require("./config/db.config")
const { notFound, errorHandler } = require("./middlewares/errorHandlers")
const { morganMiddleware } = require("./middlewares/logger")

// connection to database
// mongodbConnection()

const app = express()

if (process.env.NODE_ENV === "development") {
	app.use(morgan("dev"))
}
app.use("/uploads", express.static(path.join(__dirname, "/uploads")))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(ExpressMongoSanitize())
app.use(morganMiddleware)

app.post("/", (req, res) => {
	res.status(200).json({ msg: "Crimson Invoice Plus" })
})

const PORT = process.env.PORT || 4789

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
	console.log(`Server running in http://localhost:${PORT}`.blue.bold)
})
