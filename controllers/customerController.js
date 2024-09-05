const expressAsyncHandler = require("express-async-handler")
const Customer = require("../models/customerModel")

exports.addCustomer = expressAsyncHandler(async (req, res, next) => {
	const { name, phoneNumber, email, city, country, address, vatTinNo } =
		req.body

	//TODO: validate login user
	const userId = req.auth.id
	if (!userId) {
		res.status(401)
		throw new Error("Unauthorized. Invalid access token. Login to continue")
	}
	if (!email || !name || !phoneNumber) {
		res.status(400)
		throw new Error("Please fill all fields")
	}

	const existingCustomer = await Customer.findOne({ email })

	if (existingCustomer) {
		res.status(400)
		throw new Error("Customer already exists")
	}

	try {
		const customer = await Customer.create({
			name,
			phoneNumber,
			email,
			city,
			country,
			address,
			vatTinNo,
			addedBy: userId,
		})

		if (!customer) {
			res.status(400)
			throw new Error("Customer not added. Please try again.")
		}

		res.status(201).json({
			message: `Customer added successfully`,
			success: true,
		})
	} catch (error) {
		next(error)
	}
})

exports.fetchUserCustomers = expressAsyncHandler(async (req, res, next) => {
	const pageSize = 10
	const page = Number(req.query.page) || 1
	const userId = req.auth.id

	if (!userId) {
		res.status(401)
		throw new Error("Unauthorized. Invalid access token. Login to continue")
	}

	const count = await Customer.countDocuments({ addedBy: userId })

	const customers = await Customer.find({ addedBy: userId })
		.skip(pageSize * (page - 1))
		.limit(pageSize)
		.sort({ createdAt: -1 })

	res.status(200).json({
		message: `Customer fetched successfully`,
		success: true,
		totalCustomers: count,
		numberOfPages: Math.ceil(count / pageSize),
		myCustomers: customers,
	})
})
