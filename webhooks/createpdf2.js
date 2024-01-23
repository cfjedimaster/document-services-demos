/*
This simple script creates a PDF but uses webhooks.
This demos custom headers.
*/

import 'dotenv/config';
import fs from 'fs';

const input = '../source_pdfs/example.docx';

const REST_API = "https://pdf-services.adobe.io/";
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const WEBHOOK = 'https://aee2-76-72-10-106.ngrok-free.app/';

async function accessToken(id, secret) {

	return new Promise(async (resolve, reject) => {

		const params = new URLSearchParams();
		params.append('client_id', id);
		params.append('client_secret', secret);

		let resp = await fetch('https://pdf-services-ue1.adobe.io/token', 
			{ 
				method: 'POST', 
				body: params,
				headers: {
				'Content-Type':'application/x-www-form-urlencoded'
			},
		}
		);
		let data = await resp.json();
		resolve(data.access_token);

	});
	
}

async function getUploadData(mediaType, token, clientId) {
	let body = {
		'mediaType': mediaType
	};
	body = JSON.stringify(body);

	let req = await fetch(REST_API+'/assets', {
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

async function createPDFJob(asset, webhook, token, clientId) {

	let body = {
		'assetID': asset.assetID,
		'documentLanguage': 'en-US',
		'notifiers': [
			{
				'type':'CALLBACK',
				'data':{
					'url':webhook,
					'headers': {
						'cats':new Date()
					}
				}
			}
		]
	};


	body = JSON.stringify(body);

	let req = await fetch(REST_API+'operation/createpdf', {
		method:'post',
		headers: {
			'X-API-Key':clientId,
			'Authorization':`Bearer ${token}`,
			'Content-Type':'application/json'
		},
		body: body
	});

	return req.headers.get('location');

}

/*
I simplify the process of uploading. 
*/
async function upload(filePath, mediaType, token, clientId) {
	let uploadData = await getUploadData(mediaType, token, clientId);
	await uploadFile(uploadData.uploadUri, filePath, mediaType);
	return uploadData;
}

let token = await accessToken(CLIENT_ID, CLIENT_SECRET);
let asset = await upload(input, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', token, CLIENT_ID);
console.log('Word doc uploaded.');
let result = await createPDFJob(asset, WEBHOOK, token, CLIENT_ID);
console.log(result);