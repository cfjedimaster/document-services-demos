/*
A sample of converting to PDF. Duh.
*/

import 'dotenv/config';
import ServicesWrapper from './ServicesWrapper.js';

let sw = new ServicesWrapper(process.env.CLIENT_ID, process.env.CLIENT_SECRET);

(async () => {
	let filePath = '../source_pdfs/example.docx';

	let asset = await sw.upload(filePath);
	console.log('Doc uploaded');

	let job = await sw.createPDFJob(asset);
	console.log('Create job started.');

	await sw.downloadWhenDone(job, '../source_pdfs/example.pdf');
	console.log('Job done');

})();
