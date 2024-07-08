import fs from 'fs';

import { Readable } from 'stream';
import { finished } from 'stream/promises';

let REST_API = "https://pdf-services.adobe.io/";

let CLIENT_ID = process.env.CLIENT_ID;
let CLIENT_SECRET = process.env.CLIENT_SECRET;

let SOURCE_PDF = './adobe_security.pdf';
let WATERMARK_PDF = './wm.pdf';

async function delay(x) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), x);
	});
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

async function getUploadData(mediaType, token, clientId) {

	let body = {
		'mediaType': mediaType
	};
	body = JSON.stringify(body);

	let req = await fetch(REST_API+'assets', {
		method:'post',
		headers: {
			'X-API-Key':clientId,
			'Authorization':`Bearer ${token}`,
			'Content-Type':'application/json'
		},
		body: body
	});

	let data = await req.json();
	return data;
}

async function uploadFile(url, filePath, mediaType) {

	let stream = fs.createReadStream(filePath);
	let stats = fs.statSync(filePath);
	let fileSizeInBytes = stats.size;

	let upload = await fetch(url, {
		method:'PUT', 
		redirect:'follow',
		headers: {
			'Content-Type':mediaType, 
			'Content-Length':fileSizeInBytes
		},
		duplex:'half',
		body:stream
	});

	if(upload.status === 200) return;
	else {
		throw('Bad result, handle later.');
	}

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

async function downloadFile(url, filePath) {
	let res = await fetch(url);
	const body = Readable.fromWeb(res.body);
	const download_write_stream = fs.createWriteStream(filePath);
	return await finished(body.pipe(download_write_stream));
}

async function watermarkJob(source, watermark, token, clientId) {
	let body = {
		'inputDocumentAssetID': source.assetID,
		'watermarkDocumentAssetID': watermark.assetID
	}

	let resp = await fetch(REST_API + 'operation/addwatermark', {
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

(async () => {

	let accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET);
	console.log('Got our access token.');

	let sourceAsset = await getUploadData('application/pdf', accessToken, CLIENT_ID);
	await uploadFile(sourceAsset.uploadUri, SOURCE_PDF, 'application/pdf');
	console.log('Source PDF Uploaded.');

	let wmAsset = await getUploadData('application/pdf', accessToken, CLIENT_ID);
	await uploadFile(wmAsset.uploadUri, WATERMARK_PDF, 'application/pdf');
	console.log('Watermark PDF Uploaded.');

	let job = await watermarkJob(sourceAsset, wmAsset, accessToken, CLIENT_ID);
	console.log('Job created. Now to poll it.');

	let result = await pollJob(job, accessToken, CLIENT_ID);
	console.log('Job is done.'); 


	await downloadFile(result.asset.downloadUri, 'watermarked.pdf');

	console.log('All done!');
})();