const expressAsyncHandler = require("express-async-handler")
const Customer = require("../models/customerModel")
const Document = require("../models/documentModel")
const pdfTemplate = require("../utils/pdf/pdfTemplate")
const pdf = require("html-pdf")
const path = require("path")
const sendEmail = require("../utils/sendMail")
const sendInvoiceEmail = require("../utils/sendInvoice")
const emailTemplate = require("../utils/pdf/emailTemplate")
const options = require("../utils/pdf/options")

const filepath = path.join(__dirname, "../docs/myDocument.pdf")

exports.createDocument = expressAsyncHandler(async (req, res, next) => {
	const userId = req?.auth?.id

	const customer = await Customer.findOne({ addedBy: userId })

	if (!customer) {
		res.status(404)
		throw new Error(
			"That customer does not exist for the currently logged in user"
		)
	}

	if (customer?.addedBy?.toString() !== userId?.toString()) {
		res.status(400)
		throw new Error(
			"You are not allowed to create documents for customers who you did not create"
		)
	}

	console.log({ doc: req.body })

	const fieldsToCreate = req.body
	const {
		dueDate,
		additionalInfo,
		termsConditions,
		status,
		subTotal,
		salesTax,
		rates,
		documentType,
		total,
		currency,
		billingItems,
	} = req.body

	try {
		const document = await Document.create({
			addedBy: userId,
			customer: {
				name: req.body.customer.name,
				email: req.body.customer.email,
				vatTinNo: req.body.customer.vatTinNo,
				address: req.body.customer.address,
				city: req.body.customer.city,
				country: req.body.customer.country,
				phoneNumber: req.body.customer.phoneNumber,
			},
			documentType,
			dueDate,
			additionalInfo,
			termsConditions,
			status,
			subTotal,
			salesTax,
			rates,
			total,
			currency,
			billingItems,
		})

		if (!document) {
			res.status(400)
			throw new Error("The document could not be created")
		}

		res.status(200).json({
			success: true,
			document,
		})
	} catch (error) {
		next(error)
	}
})

exports.createDocumentPayment = expressAsyncHandler(async (req, res, next) => {
	const documentId = req.params.id

	try {
		const document = await Document.findById(documentId)

		const { datePaid, amountPaid, paymentMethod, additionalInfo } = req.body

		const payment = {
			paidBy: document.customer.name,
			datePaid,
			amountPaid,
			paymentMethod,
			additionalInfo,
		}
		document.paymentRecords.push(payment)

		await document.save()

		res.status(201).json({
			success: true,
			message: "Payment has been recorded successfully",
		})
	} catch (error) {
		next(error)
	}
})

exports.fetchUserDocuments = expressAsyncHandler(async (req, res, next) => {
	const pageSize = 10
	const page = Number(req.query.page) || 1

	const userId = req?.auth?.id

	const count = await Document.countDocuments({ addedBy: userId })

	const documents = await Document.find({ addedBy: userId })
		.sort({
			createdAt: -1,
		})
		.limit(pageSize)
		.skip(pageSize * (page - 1))
		.lean()

	res.json({
		success: true,
		totalDocuments: count,
		numberOfPages: Math.ceil(count / pageSize),
		myDocuments: documents,
	})
})

exports.fetchDocument = expressAsyncHandler(async (req, res, next) => {
	const documentId = req.params.id
	const document = await Document.findById(documentId)

	const userId = req?.auth?.id

	if (!document) {
		res.status(204)
		throw new Error("Document not found")
	}

	if (document?.id !== userId) {
		res.status(200).json({
			success: true,
			document,
		})
	} else {
		res.status(401)
		throw new Error(
			"You are not authorized to view this document. It's not yours"
		)
	}
})

exports.updateDocument = expressAsyncHandler(async (req, res, next) => {
	const userId = req?.auth?.id
	const documentId = req.params.id
	const document = await Document.findById(documentId)

	if (!document) {
		res.status(404)
		throw new Error("That document does not exist")
	}

	if (document.addedBy?.toString() !== userId) {
		res.status(401)
		throw new Error(
			"You are not authorized to update this document. It's not yours"
		)
	}

	const newUpdatedDocument = await Document.findByIdAndUpdate(
		documentId,
		req.body,
		{ new: true, runValidators: true }
	)

	res.status(200).json({
		success: true,
		message: `Your ${newUpdatedDocument.documentType}'s info was updated successfully`,
		newUpdatedDocument,
	})
})

exports.deleteDocument = expressAsyncHandler(async (req, res, next) => {
	const userId = req?.auth?.id
	const documentId = req.params.id
	const document = await Document.findById(documentId)

	if (!document) {
		res.status(404)
		throw new Error("That document does not exist!")
	}

	if (document.addedBy?.toString() !== userId) {
		res.status(401)
		throw new Error(
			"You are not authorized to delete this document. It's not yours"
		)
	}

	try {
		await document.deleteOne()
		res.json({ success: true, message: "Your document has been deleted" })
	} catch (error) {
		next(error)
	}
})

exports.generatePdf = expressAsyncHandler(async (req, res, next) => {
	pdf
		.create(pdfTemplate(req.body), options)
		.toFile("../docs/myDocument.pdf", (err) => {
			if (err) {
				res.send(Promise.reject())
			}
			res.send(Promise.resolve())
		})
})

exports.fetchPdf = expressAsyncHandler(async (req, res, next) => {
	res.sendFile(filepath)
})

exports.sendDocument = expressAsyncHandler(async (req, res, next) => {
	const { profile, document } = req.body

	pdf.create(pdfTemplate(req.body), options).toFile(filepath, async (err) => {
		const data = {
			from: process.env.SENDER_EMAIL,
			to: `${document.customer.email}`,
			replyTo: `${profile.email}`,
			subject: `Document from ${
				profile.businessName ? profile.businessName : profile.firstname
			}`,
			text: `Document from ${
				profile.businessName ? profile.businessName : profile.firstname
			}`,
			html: emailTemplate(req.body),
			attachments: [
				{
					filename: "myDocument.pdf",
					path: filepath,
				},
			],
		}

		await sendInvoiceEmail(data)

		if (err) {
			res.send(Promise.reject())
		}
		res.json({ message: `Document sent to ${document.customer.name} ` })
	})
})
