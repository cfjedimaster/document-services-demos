// https://www.kindacode.com/article/node-js-how-to-use-import-and-require-in-the-same-file
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import fetch from 'node-fetch';
import 'dotenv/config';
const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const AdmZip = require('adm-zip');
import { nanoid } from 'nanoid';
import fs from 'fs';

const IBMKEY = process.env.IBMKEY;
const IBMURL = process.env.IBMURL;

(async () => {


	let pdfPath = process.argv[2];
	if(!pdfPath) {
		console.log('To use this tool, pass in the path to a PDF document: node demo.js <pathtopdf>');
		process.exit(1);
	}

	if(!fs.existsSync(pdfPath)) {
		console.error(`Can't find input file: ${pdfPath}`);
		process.exit(1);
	}

//	let pdfPath = '../../extract_examples/PlanetaryScienceDecadalSurvey.pdf';
	let text = await getTextFromPDF(pdfPath, './pdfservices-api-credentials.json');

	let textAnalysis = await parseText(text, IBMKEY, IBMURL);

	// Note, assumes *nix paths
	let results = {
		input: pdfPath.split('/').pop(),
		analysis:textAnalysis
	}
	//console.log(JSON.stringify(results,null,'\t'));

	fs.writeFileSync('./output.json', JSON.stringify(results));
	console.log('Done parsing and analyzing and stored the result.');
	
})();

async function parseText(text, key, url) {

	let apiurl = url + '/v1/analyze?version=2019-07-12';
	let auth = 'Basic ' + Buffer.from(`apikey:${key}`).toString('base64');

	let body = {
		text, 
		features: {
			categories: {
			},
			concepts: {
			},
			keywords: {
				emotion: true
			},
			entities: {
				sentiment: true
			},
			summarization: {
			}
		}
	}

	let request = await fetch(apiurl, {
		method:'POST', 
		headers: {
			'Authorization':auth,
			'Content-Type':'application/json'
		}, 
		body: JSON.stringify(body)
	});

	return await request.json();
}

async function getTextFromPDF(pathToPDF, creds) {

	const credentials = PDFServicesSdk.Credentials
			.serviceAccountCredentialsBuilder()
			.fromFile(creds)
			.build();


	const config = PDFServicesSdk.ClientConfig.clientConfigBuilder().withConnectTimeout(360000).withReadTimeout(360000).build();

	// Create an ExecutionContext using credentials
	const executionContext = PDFServicesSdk.ExecutionContext.create(credentials,config);

	const options = new PDFServicesSdk.ExtractPDF.options.ExtractPdfOptions.Builder().
		addElementsToExtract(PDFServicesSdk.ExtractPDF.options.ExtractElementType.TEXT).build()

	// Create a new operation instance.
	const extractPDFOperation = PDFServicesSdk.ExtractPDF.Operation.createNew(),
		input = PDFServicesSdk.FileRef.createFromLocalFile(
			pathToPDF,
			PDFServicesSdk.ExtractPDF.SupportedSourceFormat.pdf
		);

	extractPDFOperation.setInput(input);
	extractPDFOperation.setOptions(options);

	let outputZip = './' + nanoid() + '.zip';

	let result = await extractPDFOperation.execute(executionContext);
	let saveOp = await result.saveAsFile(outputZip);

	let zip = new AdmZip(outputZip);
	let data = JSON.parse(zip.readAsText('structuredData.json'));

	let text = data.elements.filter(e => e.Text).reduce((result, e) => {
		return result + e.Text + '\n';
	},'');

	fs.unlinkSync(outputZip);

	return text;
	
}

function generateHTML(input) {
	return '<h1>hello</h1>';
}