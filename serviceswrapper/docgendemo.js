import 'dotenv/config';
import ServicesWrapper from './ServicesWrapper.js';

let sw = new ServicesWrapper(process.env.CLIENT_ID, process.env.CLIENT_SECRET);

(async () => {
	let filePath = 'replace with input';

	let asset = await sw.upload(filePath);
	console.log('Word uploaded');

	let job = await sw.createDocumentGenerationJob(asset,"docx", {'name':'ray'});
	console.log('DocGen job started.');

	await sw.downloadWhenDone(job, 'replace with output');
	console.log('Job done');


})();
