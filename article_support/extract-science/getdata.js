/*
My goal is to get the data out of the PDFs (if necessary, we cache), and then suck it
all into one data structure that I can then do... whatever with.
*/

const globby = require('globby');
const fs = require('fs');
const nanoid = require('nanoid').nanoid;
const StreamZip = require('node-stream-zip');
const csv = require('csvtojson');
const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');

// hard coded output destination for all data
const outputFile = './data.json';

(async () => {

	/*
	Top level result is an array of objects where each object contains a year value and a records value.
	records comes from the stored data created from PDF Extract. It's an array of arrays where each top
	level item in the array is a month (0 === January), and the lower array is each star + lumunosity
	*/
	const result = [];

	// step 1, figure out all my PDFs
	const pdfs = await globby('./gen/*.pdf');
	
	console.log(`There are ${pdfs.length} pdfs to process.`);
	for(let i=0;i<pdfs.length;i++) {
		let pdf = pdfs[i];
		// for each pdf, if we have our data, it's stored in name.json so we don't need to process it again
		let datafile = pdf.replace('.pdf', '.json');
		let data;
		if(!fs.existsSync(datafile)) {
			console.log(`Need to fetch the data for ${pdf}`);
			data = await getData(pdf);
			fs.writeFileSync(datafile, JSON.stringify(data), 'utf8');
		} else {
			console.log(`Existing data for ${pdf}`);
			data = JSON.parse(fs.readFileSync(datafile, 'utf8'));
		}
		// we can gleam the year from the filename
		let year = pdf.split('/').pop().split('.').shift();
		result.push({
			year, 
			data
		});
	}

	fs.writeFileSync(outputFile, JSON.stringify(result), 'utf8');
	console.log(`Done, and wrote out the result to ${outputFile}`);

})();

/*
I'm the uber function. Given a path, I ran PDF Extraction on it to get the tables, then parse 
the tables such that I have an array of 'readings' for month/day/start/luminance. Note that
I'm assuming the default credentials of pdftools-api-credentials.json and private.key. Bad to assume, 
but I'm doing that for now.
*/
async function getData(pdf) {

	return new Promise(async (resolve, reject) => {
		const credentials = PDFServicesSdk.Credentials
			.serviceAccountCredentialsBuilder()
			.fromFile('pdftools-api-credentials.json')
			.build();

		const executionContext = PDFServicesSdk.ExecutionContext.create(credentials);

		const options = new PDFServicesSdk.ExtractPDF.options.ExtractPdfOptions.Builder()
			.addElementsToExtract(PDFServicesSdk.ExtractPDF.options.ExtractElementType.TABLES)
			.addTableStructureFormat(PDFServicesSdk.ExtractPDF.options.TableStructureType.CSV)
			.build();

		const extractPDFOperation = PDFServicesSdk.ExtractPDF.Operation.createNew();
		const input = PDFServicesSdk.FileRef.createFromLocalFile(pdf,PDFServicesSdk.ExtractPDF.SupportedSourceFormat.pdf);

		extractPDFOperation.setInput(input);
		extractPDFOperation.setOptions(options);

		let output = './' + nanoid() + '.zip';

		try {
			let result = await extractPDFOperation.execute(executionContext);
			await result.saveAsFile(output);
		} catch(e) {
			console.log('Exception encountered while executing operation', err);
			reject(err)
		}

		// ok, now we need to get tables/*.csv from the zip
		const zip = new StreamZip.async({ file: output });
		const entries = await zip.entries();
		let csvs = [];
		for (const entry of Object.values(entries)) {
			if(entry.name.endsWith('.csv')) csvs.push(entry.name);
		}

		let result = [];

		for(let i=0; i<csvs.length;i++) {
			const data = await zip.entryData(csvs[i]);
			let csvContent = data.toString();
			let csvData = await csv().fromString(csvContent);
			result.push(csvData);
		}

		// cleanup
		zip.close();
		fs.unlinkSync(output);

		resolve(result);

	});
}