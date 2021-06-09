/*
This is a good demo to show getting images from a PDF. The source has posters
in it.
*/

const ExtractPdfSdk = require('@adobe/pdftools-extract-node-sdk');
const AdmZip = require('adm-zip');
const fs = require('fs');

const OUTPUT_ZIP = './output_test4.zip';
//we remove this, but in case of error, check
if(fs.existsSync(OUTPUT_ZIP)) fs.unlinkSync(OUTPUT_ZIP);

const credentials = ExtractPdfSdk.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile('pdftools-api-credentials.json')
		.build();


//Create a clientContext using credentials and create a new operation instance.
const clientContext = ExtractPdfSdk.ExecutionContext
		.create(credentials),
	extractPDFOperation = ExtractPdfSdk.ExtractPDF.Operation
		.createNew(),

	// Set operation input from a source file.
	input = ExtractPdfSdk.FileRef.createFromLocalFile(
		'PlanetaryScienceDecadalSurvey.pdf',
		ExtractPdfSdk.ExtractPDF.SupportedSourceFormat.pdf
	);

extractPDFOperation.setInput(input);

extractPDFOperation.addElementToExtract(ExtractPdfSdk.PDFElementType.TEXT);
extractPDFOperation.addElementToExtract(ExtractPdfSdk.PDFElementType.TABLES);
extractPDFOperation.addElementToExtractRenditions(ExtractPdfSdk.PDFElementType.TABLES);
extractPDFOperation.addElementToExtractRenditions(ExtractPdfSdk.PDFElementType.FIGURES);

// Execute the operation
extractPDFOperation.execute(clientContext)
	.then(result => result.saveAsFile(OUTPUT_ZIP))
	.catch(err => console.log(err));