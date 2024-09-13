const express = require("express")
const colors = require("colors")
const app = express()
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const passport = require("passport")
require("dotenv").config()
const morgan = require("morgan")
const cookieParser = require("cookie-parser")
const mongoSanitize = require("express-mongo-sanitize")
const { morganMiddleware, systemLogs } = require("./middlewares/logger")
const db_connection = require("./config/db.config")
const { notFound, errorHandler } = require("./middlewares/errorHandler")
const corsOptions = require("./config/corsOptions")
const port = process.env.PORT || 5000

app.use("/uploads", express.static(path.join(__dirname, "/uploads")))
app.use("/docs", express.static(path.join(__dirname, "/docs")))
// app.use("/", express.static(path.join(__dirname, "/README.html")))

db_connection()

if (process.env.NODE_ENV === "development") {
	app.use(morgan("dev"))
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(passport.initialize())
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(mongoSanitize())
app.use(morganMiddleware)

app.get("/", (req, res) => {
	res.send("README.html")
})

fs.readdirSync(path.join(__dirname, "routes")).map((file) => {
	const route = require(`./routes/${file}`)
	app.use("/api/v1", route)
})

app.use(notFound)
app.use(errorHandler)

app.listen(port, () => {
	console.log(`>> Server is up and running  http://localhost:${port} `.cyan)

	systemLogs.info(
		`>> Server is up and running  http://localhost:${port} `.green
	)
})
