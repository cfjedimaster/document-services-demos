const ServiceLibrary = require('./servicelibrary.js');

(async () => {

	const lib = new ServiceLibrary('./pdftools-api-credentials.json');
	try {
		await lib.export('./hamlet.pdf', './output/test.pptx', true);
	} catch(e) {
		console.error(e);
	}
	console.log('Done');

})();


