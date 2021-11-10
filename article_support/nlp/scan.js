/*
I look at our input directory of pdfs, and for each, I do the following:

If I don't have NAME.txt, use the Adobe PDF Extraction API to get the text from it.
If I don't have NAME.json, use the Diffbot NL API to get the data I need.

Note - assumes credentials in the same folder and with the default file names.
*/

require('dotenv').config();
const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const util = require('util');
const glob = util.promisify(require('glob'));
const fs = require('fs/promises');
const AdmZip = require('adm-zip');
const nanoid = require('nanoid').nanoid;
const fetch = require('node-fetch');

const DIFFBOT_KEY = process.env.DIFFBOT_KEY;

const INPUT = './pdfs/';

(async () => {

	let files = await glob(INPUT + '*.pdf');
	console.log(`Going to process ${files.length} PDFs.\n`);

	for(file of files) {
		console.log(`Checking ${file} to see if it has a txt or json file.`);

		// ToDo: This would fail with foo.pdf.pdf. Don't do that.
		let txtFile = file.replace('.pdf', '.txt');
		let jsonFile = file.replace('.pdf', '.json');

		let textExists = await exists(txtFile);
		let text;
		if(!textExists) {
			console.log(`We do not have ${txtFile} and need to make it.`);
			text = await getText(file);
			await fs.writeFile(txtFile, text);
			console.log('I have saved the extracted PDF text.');
		} else {
			console.log(`The text file ${txtFile} already exists.`);
			text = await fs.readFile(txtFile,'utf8');
		}

		let jsonExists = await exists(jsonFile);
		if(!jsonExists) {
			console.log(`We do not have ${jsonFile} and need to make it.`);
			let data = await getData(text);
			await fs.writeFile(jsonFile, JSON.stringify(data));
			console.log('I have saved the parsed data from the text.');
		} else console.log(`The data file ${jsonFile} already exists.`);

	}

})();

async function exists(p) {
	try {
		await fs.stat(p);
		return true;
	} catch(e) {
		return false;
	}
}

async function getText(pdf) {
	const credentials = PDFServicesSdk.Credentials
			.serviceAccountCredentialsBuilder()
			.fromFile('pdftools-api-credentials.json')
			.build();

	// Create an ExecutionContext using credentials
	const executionContext = PDFServicesSdk.ExecutionContext.create(credentials);

	// Build extractPDF options
	const options = new PDFServicesSdk.ExtractPDF.options.ExtractPdfOptions.Builder()
		.addElementsToExtract(
			PDFServicesSdk.ExtractPDF.options.ExtractElementType.TEXT
		)
		.build()

	// Create a new operation instance.
	const extractPDFOperation = PDFServicesSdk.ExtractPDF.Operation.createNew(),
		input = PDFServicesSdk.FileRef.createFromLocalFile(
			pdf,
			PDFServicesSdk.ExtractPDF.SupportedSourceFormat.pdf
		);

	extractPDFOperation.setInput(input);
	extractPDFOperation.setOptions(options);

	let outputZip = './' + nanoid() + '.zip';
	let result = await extractPDFOperation.execute(executionContext);
	await result.saveAsFile(outputZip);
	let zip = new AdmZip(outputZip);
	let data = JSON.parse(zip.readAsText('structuredData.json'));
	let text = data.elements.filter(e => e.Text).reduce((result, e) => {
		return result + e.Text + '\n';
	},'');

	await fs.unlink(outputZip);
	return text;
}

async function getData(text) {
	let fields = 'entities,sentiment,facts,records,categories';
	let token = DIFFBOT_KEY;
	let url = `https://nl.diffbot.com/v1/?fields=${fields}&token=${token}`;
	let body = [{
		content:text, 
		lang:'en',
		format:'plain text'
	}];

	let req = await fetch(url, { 
		method:'POST',
		body:JSON.stringify(body),
		headers: { 'Content-Type':'application/json' }
	});

	return await req.json();
}