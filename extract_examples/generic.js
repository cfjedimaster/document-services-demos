#!/usr/bin/env node

const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');

const chalk = require('chalk');
const fs = require('fs');
const AdmZip = require('adm-zip');
const nanoid = require('nanoid').nanoid;

let inputPDF = process.argv[2];
let output = process.argv[3];

if(!inputPDF || !output) {
	console.error(chalk.red('Syntax: generic.js <input pdf doc> <output location folder>'));
	process.exit(1);
}

if(!fs.existsSync(inputPDF)) {
	console.error(chalk.red(`Can't find input file ${inputPDF}`));
	process.exit(1);
}

if(!fs.existsSync(output)) {
	fs.mkdirSync(output);
}


let outputStatus = fs.statSync(output);
if(!outputStatus.isDirectory()) {
	console.error(chalk.red(`Output directory ${output} does not exist. Please make it first.`));
	process.exit(1);
}

const credentials = PDFServicesSdk.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile('pdftools-api-credentials.json')
		.build();

const config = PDFServicesSdk.ClientConfig.clientConfigBuilder().withConnectTimeout(360000).withReadTimeout(360000).build();

// Create an ExecutionContext using credentials
const executionContext = PDFServicesSdk.ExecutionContext.create(credentials,config);

// Build extractPDF options
const options = new PDFServicesSdk.ExtractPDF.options.ExtractPdfOptions.Builder()
			.addElementsToExtract(
				PDFServicesSdk.ExtractPDF.options.ExtractElementType.TEXT, 
				PDFServicesSdk.ExtractPDF.options.ExtractElementType.TABLES
			)
			.addElementsToExtractRenditions(
				PDFServicesSdk.ExtractPDF.options.ExtractRenditionsElementType.TABLES, 
				PDFServicesSdk.ExtractPDF.options.ExtractRenditionsElementType.FIGURES
			)
			.addTableStructureFormat(PDFServicesSdk.ExtractPDF.options.TableStructureType.CSV)
			.getStylingInfo(true)
			.build()

// Create a new operation instance.
const extractPDFOperation = PDFServicesSdk.ExtractPDF.Operation.createNew(),
	input = PDFServicesSdk.FileRef.createFromLocalFile(
		inputPDF,
		PDFServicesSdk.ExtractPDF.SupportedSourceFormat.pdf
	);

extractPDFOperation.setInput(input);
extractPDFOperation.setOptions(options);

let outputZip = './' + nanoid() + '.zip';
extractPDFOperation.execute(executionContext)
	.then(result => result.saveAsFile(outputZip))
	.then(async () => {
		let zip = new AdmZip(outputZip);	
		await zip.extractAllTo(output);
		fs.unlinkSync(outputZip);
		console.log(chalk.green(`Extracted data from ${inputPDF} to output directory ${output}.`));
	})
	.catch(err => console.log(err));