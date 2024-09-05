const express = require("express")
const { requireSignIn } = require("../middlewares/authMiddleware")
const {
	addCustomer,
	fetchUserCustomers,
} = require("../controllers/customerController")
const customerRouter = express.Router()

customerRouter.post("/customer/create", requireSignIn, addCustomer)
customerRouter.get("/customers", requireSignIn, fetchUserCustomers)
// customerRouter.get("/")
// customerRouter.get("/")
// customerRouter.get("/")
// customerRouter.get("/")

module.exports = customerRouter
