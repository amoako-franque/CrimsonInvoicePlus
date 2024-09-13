const expressAsyncHandler = require("express-async-handler")
const Customer = require("../models/customerModel")

exports.addCustomer = expressAsyncHandler(async (req, res, next) => {
	const { email, name, phoneNumber, vatTinNo, address, city, country } =
		req.body

	const userId = req?.auth?.id

	// validation
	if (!userId) {
		res.status(400)
		throw new Error("Please Login to continue")
	}

	if (!email || !name || !phoneNumber) {
		res.status(400)
		throw new Error(
			"A Customer must have at least a name, email and phone number"
		)
	}

	const existingCustomer = await Customer.findOne({ email })

	if (existingCustomer) {
		res.status(400)
		throw new Error("That Customer already exists")
	}

	try {
		const customer = await Customer.create({
			addedBy: userId,
			name,
			email,
			phoneNumber,
			vatTinNo,
			address,
			city,
			country,
		})

		if (!customer) {
			res.status(400)
			throw new Error("Customer could not be created")
		}

		res.status(201).json({
			success: true,
			message: `Your customer named: ${customer.name}, was created successfully`,
			customer,
		})
	} catch (error) {
		next(error)
	}
})

exports.fetchUserCustomers = expressAsyncHandler(async (req, res, next) => {
	const pageSize = 10
	const page = Number(req.query.page) || 1

	const userId = req?.auth?.id
	if (!userId) {
		res.status(400)
		throw new Error("Please Login to continue")
	}

	const count = await Customer.countDocuments({ addedBy: userId })

	const customers = await Customer.find({ addedBy: userId })
		.sort({
			createdAt: -1,
		})
		.limit(pageSize)
		.skip(pageSize * (page - 1))
		.lean()

	res.json({
		success: true,
		totalCustomers: count,
		numberOfPages: Math.ceil(count / pageSize),
		myCustomers: customers,
	})
})

exports.fetchACustomer = expressAsyncHandler(async (req, res, next) => {
	const customerId = req.params.id
	const customer = await Customer.findById(customerId)

	const userId = req?.auth?._id

	if (!userId) {
		res.status(400)
		throw new Error("Please Login to continue")
	}

	if (!customer) {
		res.status(204)
		throw new Error("Customer not found")
	}

	if (customer.id !== userId) {
		res.status(200).json({
			success: true,
			customer,
		})
	} else {
		res.status(401)
		throw new Error(
			"You are not authorized to view this customer's information. He/She is not your customer"
		)
	}
})

exports.updateCustomer = expressAsyncHandler(async (req, res, next) => {
	const customerId = req.params.id
	const customer = await Customer.findById(customerId)

	const userId = req?.auth?.id

	if (!userId) {
		res.status(400)
		throw new Error("Please Login to continue")
	}
	if (!customer) {
		res.status(404)
		throw new Error("That Customer does not exist")
	}

	if (customer.addedBy.toString() !== userId) {
		res.status(401)
		throw new Error(
			"You are not authorized to update this customer's information. He/She is not your customer"
		)
	}

	const fieldsToUpdate = req.body

	const updatedCustomer = await Customer.findByIdAndUpdate(
		{ _id: customerId },
		{ ...fieldsToUpdate, customerId },
		{ new: true, runValidators: true }
	)

	res.status(200).json({
		success: true,
		message: `${customer.name}'s info was successfully updated`,
		updatedCustomer,
	})
})

exports.deleteCustomer = expressAsyncHandler(async (req, res, next) => {
	const customerId = req.params.id
	const customer = await Customer.findById(customerId)

	const userId = req?.auth?.id

	if (!userId) {
		res.status(400)
		throw new Error("Please Login to continue")
	}

	if (!customer) {
		res.status(404)
		throw new Error("That customer does not exist!")
	}

	if (customer.addedBy.toString() !== userId) {
		res.status(403)
		throw new Error(
			"You are not authorized to delete this customer's information. He/She is not your customer!"
		)
	}

	await customer.deleteOne()

	res.json({ success: true, message: "You have deleted your customer." })
})
