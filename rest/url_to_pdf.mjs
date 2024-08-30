import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

let CLIENT_ID = process.env.CLIENT_ID;
let CLIENT_SECRET = process.env.CLIENT_SECRET;

async function delay(x) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), x);
	});
}

async function downloadFile(url, filePath) {
	let res = await fetch(url);
	const body = Readable.fromWeb(res.body);
	const download_write_stream = fs.createWriteStream(filePath);
	return await finished(body.pipe(download_write_stream));
}

async function getAccessToken(id, secret) {

	const params = new URLSearchParams();
	params.append('client_id', id);
	params.append('client_secret', secret);

	let resp = await fetch('https://pdf-services-ue1.adobe.io/token', { 
		method: 'POST', 
		headers: {
			'Content-Type':'application/x-www-form-urlencoded'
		},
		body:params 
	});
	let data = await resp.json();
	return data.access_token;
}

async function pollJob(url, token, clientId) {

	let status = null;
	let asset; 

	while(status !== 'done') {
		let req = await fetch(url, {
			method:'GET',
			headers: {
				'X-API-Key':clientId,
				'Authorization':`Bearer ${token}`,
			}
		});

		let res = await req.json();

		status = res.status;
		if(status === 'done') {
			asset = res;
		} else {
			await delay(2000);
		}
	}

	return asset;
}

async function getCreateJob(url, token, clientId) {

	let body = {
		'inputUrl': url
	}

	let resp = await fetch('https://pdf-services-ue1.adobe.io/operation/htmltopdf', {
		method: 'POST', 
		headers: {
			'Authorization':`Bearer ${token}`, 
			'X-API-KEY':clientId,
			'Content-Type':'application/json'
		},
		body:JSON.stringify(body)
	});

	return resp.headers.get('location');

}

let url = 'https://www.raymondcamden.com';

let token = await getAccessToken(CLIENT_ID, CLIENT_SECRET);
let job = await getCreateJob(url, token, CLIENT_ID);

let result = await pollJob(job, token, CLIENT_ID);
console.log('Job is done.'); 

await downloadFile(result.asset.downloadUri, 'url_to_pdf_result.pdf');
console.log('Done');

