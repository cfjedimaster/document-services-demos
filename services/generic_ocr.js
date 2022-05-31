const pdfSDK = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');
const chalk = require('chalk');

(async ()=> {

	const input = process.argv[2];
	const output = process.argv[3];
	const locale = process.argv[4];

	if(!input || !output) {
		console.error(chalk.red('Syntax: generic_ocr.js <input pdf doc> <output file> <optional locale>'));
		process.exit(1);
	}

	if(!fs.existsSync(input)) {
		console.error(chalk.red(`Can't find input file ${input}`));
		process.exit(1);
	}

	// careful....
	if(fs.existsSync(output)) fs.unlinkSync(output);

	await ocrPDF(input, output, locale, './pdfservices-api-credentials.json');
	console.log(chalk.green(`OCRed ${input} to ${output}`));


})();

async function ocrPDF(source, output, locale, creds) {

    return new Promise((resolve, reject) => {

		const credentials =  pdfSDK.Credentials
		.serviceAccountCredentialsBuilder()
		.fromFile(creds)
		.build();

		const executionContext = pdfSDK.ExecutionContext.create(credentials),
				ocrOperation = pdfSDK.OCR.Operation.createNew();

		// Set operation input from a source file
		const input = pdfSDK.FileRef.createFromLocalFile(source);
		ocrOperation.setInput(input);

		if(locale) {
			const options = new pdfSDK.OCR.options.OCROptions.Builder()
			.withOcrType(pdfSDK.OCR.options.OCRSupportedType.SEARCHABLE_IMAGE_EXACT)
			.withOcrLang(pdfSDK.OCR.options.OCRSupportedLocale[locale])
			.build();
			ocrOperation.setOptions(options);
		}

		// Execute the operation and Save the result to the specified location.
		ocrOperation.execute(executionContext)
		.then(result => result.saveAsFile(output))
		.then(() => resolve())
		.catch(err => {
			if(err instanceof pdfSDK.Error.ServiceApiError
			|| err instanceof pdfSDK.Error.ServiceUsageError) {
				reject(err);
			} else {
				reject(err);
			}
		});

	});
}