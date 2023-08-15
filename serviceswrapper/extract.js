require('dotenv').config();
const ServicesWrapper = require('./ServicesWrapper');

let sw = new ServicesWrapper(process.env.CLIENTID, process.env.CLIENTSECRET);

(async () => {
	let filePath = '../source_pdfs/schoolcalendar.pdf';
	let mediaType = 'application/pdf';

	let asset = await sw.upload(filePath, mediaType);
	console.log('PDF uploaded');

	let job = await sw.createExtractJob(asset);
	console.log('Extract job started.');

	let result = await sw.pollJob(job);
	console.log('Job done');

	/* 
	One example, download the json, or you can download the zip at result.resource.downloadUri...
	await sw.downloadFile(result.content.downloadUri, './extract.json');
	
	But instead, let's just fetch the json direct.
	*/
	let jsonReq = await fetch(result.content.downloadUri);
	let json = await jsonReq.json();
	console.log(JSON.stringify(json.extended_metadata, null, '\t'));


})();
