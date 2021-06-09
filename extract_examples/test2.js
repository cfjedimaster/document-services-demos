const ExtractPdfSdk = require('@adobe/pdftools-extract-node-sdk');
const AdmZip = require('adm-zip');
const fs = require('fs');

const OUTPUT_ZIP = './output.zip';
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
		'Beamswords_and_Bazookas.pdf',
		ExtractPdfSdk.ExtractPDF.SupportedSourceFormat.pdf
	);

extractPDFOperation.setInput(input);

extractPDFOperation.addElementToExtract(ExtractPdfSdk.PDFElementType.TEXT);

// Execute the operation
extractPDFOperation.execute(clientContext)
	.then(result => result.saveAsFile(OUTPUT_ZIP))
	.then(() => {
		let zip = new AdmZip(OUTPUT_ZIP);		
		var zipEntries = zip.getEntries(); // an array of ZipEntry records
		zip.extractEntryTo("structuredData.json", "./", false, true);
		fs.unlinkSync(OUTPUT_ZIP);

		let data = JSON.parse(fs.readFileSync('./structuredData.json', 'utf-8'));
		console.log('Total elements',data.elements.length);

		let text = data.elements.filter(e => e.Text).reduce((result, e) => {
			return result + e.Text + '\n';
		},'');

		fs.writeFileSync('./text-test.txt', text);

	})
	.catch(err => console.log(err));