/*

I will: 
	Scan my input directory for PDFs
	For each, see if [filename]_images/ exist. If not:
		Call PDF Extract, get the images, and copy em there
	For each PDF with images:
		Get a list of the images, maxed out to some sensible #
		For each image, look for: [filename].json
		If not, call Microsoft's service and get that stuff, then save it.

*/

require('dotenv').config();
const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');
const fsp = require('fs/promises');
const fetch = require('node-fetch');
const util = require('util');
const glob = util.promisify(require('glob'));
const AdmZip = require('adm-zip');
const nanoid = require('nanoid').nanoid;

// Directory of source PDFs
const INPUT = './pdfs/';

// Max analysis: given a pdf has N+ images, we want to limit how many we scan
const MAX_IMAGE = 5;

const MS_IMAGE_KEY = process.env.MS_IMAGE_KEY;
const MS_IMAGE_ENDPOINT = process.env.MS_IMAGE_ENDPOINT;

(async () => {


	let files = await glob(INPUT + '*.pdf');

	console.log(`Going to process ${files.length} PDFs.\n`);

	for(file of files) {

		console.log(`Checking ${file} to see if it has an images directory.`);

		let imagesDir = file + '_images/';
		let imagesDirExists = await exists(imagesDir);

		if(!imagesDirExists) {
			console.log(`Calling Extract API to get images for ${file}`);
			await getImages(file, imagesDir);
			console.log('Images extracted (if any).');
		} else console.log('The image directory already existed, no need to Extract');

		/*
		A PDF may or may not have images. We always make the folder as it's a good way 
		to know we extracted crap, but we now need to get a list of (any) images in there
		to see if they need to be processed by our awesome image recognition service.
		*/
		let images = await glob(imagesDir + '*.png');
		if(images.length) {
			// for each, see if we have (name).json
			if(images.length > MAX_IMAGE) {
				console.log(`Note, not analyzing all images. Total (${images.length}) greater than max (${MAX_IMAGE})`);
			}
			for(let i=0; i<Math.min(images.length, MAX_IMAGE); i++) {
				let analysisName = images[i].replace(/.png$/, '.json');
				let analysisExists = await exists(analysisName);
				if(!analysisExists) {
					console.log(`Need to analyze image ${images[i]}`);
					let info = await getImageInfo(images[i]);
					fs.writeFileSync(analysisName, JSON.stringify(info));
					console.log(`Analysis saved.`);
				} else console.log(`No need to analyze image ${images[i]}`);
			}

		}

	}

})();

async function getImageInfo(path) {

	let theUrl = MS_IMAGE_ENDPOINT + 
			'vision/v3.2/analyze?visualFeatures=Categories,Tags,Description&language=en';

	let headers = {
		'Content-Type':'application/octet-stream',
		'Ocp-Apim-Subscription-Key':MS_IMAGE_KEY
	}

	let resp = await fetch(theUrl, {
		method:'post', 
		headers:headers, 
		body:fs.createReadStream(path)
	});

	return await resp.json();

}

async function getImages(pdf,outputDir) {

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
		.addElementsToExtractRenditions(
			PDFServicesSdk.ExtractPDF.options.ExtractRenditionsElementType.FIGURES
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

	await fsp.mkdir(outputDir);

	let zip = new AdmZip(outputZip);
	let entries = zip.getEntries();
	zip.getEntries().forEach(entry => {
		if(entry.entryName.indexOf('figures/') === 0) {
			zip.extractEntryTo(entry, outputDir, false, true);
		}
	});
	await fsp.unlink(outputZip);
	return;
}

async function exists(p) {
	try {
		await fsp.stat(p);
		return true;
	} catch(e) {
		return false;
	}
}