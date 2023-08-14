require('dotenv').config();
const ServicesWrapper = require('./ServicesWrapper');

let sw = new ServicesWrapper({
	clientId: process.env.CLIENTID,
	clientSecret: process.env.CLIENTSECRET
});

(async () => {
	let filePath = './schoolcalendar.pdf';
	let mediaType = 'application/pdf';
	//let downloadPath = './extract.zip';

	let asset = await sw.upload(filePath, mediaType);
	console.log('PDF uploaded');

	let job = await sw.createExtractJob(asset);
	console.log('Extract job started.');

	let result = await sw.pollJob(job);
	console.log('Job done');

	await sw.downloadFile(result.content.downloadUri, './extract.json');
	console.log('Done');


})();
