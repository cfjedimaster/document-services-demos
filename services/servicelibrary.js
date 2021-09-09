const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const fs = require('fs/promises');

class ServiceLibrary {

	constructor(creds) {
		this.credentials =  PDFServicesSdk.Credentials
       .serviceAccountCredentialsBuilder()
       .fromFile(creds)
       .build();
	}

	async _exists(path) {
		try {
			await fs.stat(path);
			return true;
		} catch {
			return false;
		}
	}

	// hard coded to export to docx, to change
	async export(from, to, overwrite=false) {

		const executionContext = PDFServicesSdk.ExecutionContext.create(this.credentials),
		exportPDF = PDFServicesSdk.ExportPDF;

		try {
			await fs.stat(from);
		} catch {
			throw(`Input file, ${from}, does not exist`);
		}

		let ext = to.split('.').pop().toLowerCase();
		let exportPdfOperation;
		switch(ext) {
			case 'docx': exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.DOCX); break;
			case 'doc': exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.DOC); break;
			case 'jpeg': exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.JPEG); break;
			case 'png': exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.PNG); break;
			case 'pptx': exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.PPTX); break;
			case 'rtf': exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.RTF); break;
			case 'xlsx': exportPdfOperation = exportPDF.Operation.createNew(exportPDF.SupportedTargetFormats.XLSX); break;
			default: throw('Invalid extension requested');
		}

		//if the file exists, throw an error
		if(!overwrite) {
			let exists = await this._exists(to);
			if(exists) throw(`Output file, ${to}, exists and can't be overwritten.`);
		} else {
			let exists = await this._exists(to);
			if(exists) await fs.unlink(to);
		}

		// Set operation input from a source file
		const input = PDFServicesSdk.FileRef.createFromLocalFile(from);
		exportPdfOperation.setInput(input);

		let result = await exportPdfOperation.execute(executionContext);
		await result.saveAsFile(to);
		return true;

	}

}

module.exports = ServiceLibrary;