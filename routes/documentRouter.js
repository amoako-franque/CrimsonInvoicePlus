const express = require("express")
const {
	createDocument,
	fetchUserDocuments,
	createDocumentPayment,
	fetchDocument,
	updateDocument,
	deleteDocument,
	generatePdf,
	sendDocument,
	fetchPdf,
} = require("../controllers/documentController")
const { requireSignIn } = require("../middlewares/authMiddleware")
const documentRouter = express.Router()

documentRouter.post("/document/create", requireSignIn, createDocument)
documentRouter.get("/documents", requireSignIn, fetchUserDocuments)
documentRouter.post(
	"/document/:id/payment",
	requireSignIn,
	createDocumentPayment
)
documentRouter.get("/document/:id", requireSignIn, fetchDocument)
documentRouter.put("/document/:id", requireSignIn, updateDocument)
documentRouter.delete("/document/:id", requireSignIn, deleteDocument)

documentRouter.post("/document/send-pdf", sendDocument)
documentRouter.post("/document/generate-pdf", generatePdf)
documentRouter.get("/document/get-pdf", fetchPdf)

module.exports = documentRouter
