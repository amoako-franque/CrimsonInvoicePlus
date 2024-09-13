const express = require("express")
const { requireSignIn } = require("../middlewares/authMiddleware")
const {
	addCustomer,
	fetchUserCustomers,
	fetchACustomer,
	updateCustomer,
	deleteCustomer,
} = require("../controllers/customersController")
const customerRouter = express.Router()
customerRouter.post("/customers/create", requireSignIn, addCustomer)
customerRouter.get("/customers", requireSignIn, fetchUserCustomers)
customerRouter.get("/customers/:id", requireSignIn, fetchACustomer)
customerRouter.put("/customers/:id", requireSignIn, updateCustomer)
customerRouter.delete("/customers/:id", requireSignIn, deleteCustomer)

module.exports = customerRouter
