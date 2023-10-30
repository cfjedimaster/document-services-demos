import 'dotenv/config';
import fs from 'fs';

import { Readable } from 'stream';
import { finished } from 'stream/promises';

const REST_API = "https://pdf-services.adobe.io/";
let cachedToken = '';

// Lame function to add a delay to my polling calls
async function delay(x) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), x);
	});
}

async function accessToken(id, secret) {

	if(cachedToken !== '') return cachedToken;

	return new Promise(async (resolve, reject) => {
		const params = new URLSearchParams();
		params.append('client_secret', secret);
		params.append('grant_type', 'client_credentials');
		params.append('scope', 'openid,AdobeID,read_organizations');

		let resp = await fetch(`https://ims-na1.adobelogin.com/ims/token/v2?client_id=${id}`, 
			{ 
				method: 'POST', 
				body: params
			}
		);
		
		let data = await resp.json();
		cachedToken = data.access_token;

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

/*
I simplify the process of uploading. 
*/
async function upload(filePath, mediaType, token, clientId) {
	let uploadData = await getUploadData(mediaType, token, clientId);
	await uploadFile(uploadData.uploadUri, filePath, mediaType);
	return uploadData;
}

async function makeCombineJob(prepend, asset, numberOfPages, token, clientId) {

	let body = {
		'assets': [
			{ 'assetID': prepend.assetID }, 
			{ 'assetID': asset.assetID, 'pageRanges': [{'start':1, 'end':numberOfPages}] }
		] 
	};

	body = JSON.stringify(body);

	let req = await fetch(REST_API+'operation/combinepdf', {
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
			return res.asset;
		} else {
			await delay(2000);
		}
	}

	return asset;
}

// Credit: https://stackoverflow.com/a/74722656/52160
async function downloadFile(url, filePath) {
	let res = await fetch(url);
	const body = Readable.fromWeb(res.body);
	const download_write_stream = fs.createWriteStream(filePath);
	return await finished(body.pipe(download_write_stream));
}

async function makeSample(input, prepend, pageSize, output) {
	// First get our token, this will cache nicely
	let token = await accessToken(process.env.CLIENT_ID, process.env.CLIENT_SECRET);

	// Upload the 'prepend' pdf
	let prependAsset = await upload(prepend, 'application/pdf', token, process.env.CLIENT_ID);

	// Upload the asset
	let asset = await upload(input, 'application/pdf', token, process.env.CLIENT_ID);

	let job = await makeCombineJob(prependAsset, asset, pageSize, token, process.env.CLIENT_ID);
	let result = await pollJob(job, token, process.env.CLIENT_ID);

	await downloadFile(result.downloadUri, output);
	console.log('Saved to output.');

}


export { makeSample };