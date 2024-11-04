/*
Given a source pdf, output images to ./output
*/

const fs = require('fs');
const { Readable } = require('stream');
const { finished } = require('stream/promises');


let REST_API = "https://pdf-services.adobe.io/";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

async function delay(x) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), x);
	});
}

async function getAccessToken(id, secret) {

	const params = new URLSearchParams();
	params.append('client_id', id);
	params.append('client_secret', secret);

	let resp = await fetch(REST_API + 'token', { 
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

async function getPDFImagesJob(asset, targetFormat, token, clientId) {
	let body = {
		'assetID': asset.assetID,
		targetFormat, 
		outputType:'listOfPageImages'
	}

	let resp = await fetch(REST_API + 'operation/pdftoimages', {
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


(async () => {

	if(process.argv.length < 3) {
		console.log('Pass the path to an input PDF via the command line.');
		process.exit(1);
	}

	let input = process.argv[2];

	if(process.argv.length > 3) type = process.argv[3];
	else type = 'jpeg';

	let accessToken = await getAccessToken(CLIENT_ID, CLIENT_SECRET);
	console.log('Got our access token.');

	let uploadedAsset = await getUploadData('application/pdf', accessToken, CLIENT_ID);


	await uploadFile(uploadedAsset.uploadUri, input, 'application/pdf');
	console.log('Source PDF Uploaded.');

	let job = await getPDFImagesJob(uploadedAsset, type, accessToken, CLIENT_ID);
	console.log('Job created. Now to poll it.');

	let result = await pollJob(job, accessToken, CLIENT_ID);
	console.log('Job is done.'); 

	/*
	In our result, result.asset.downloadUri points to the PDF w/ the report attached.
	result.report.downloadUri points to the json
	*/

	console.log(`Storing ${result.assetList.length} images.`);
	for(let i=0;i<result.assetList.length;i++) {
		let output = `./output/${i}.jpg`;
		if(result.assetList[i].metadata.type === 'image/tiff') {
			output = output.replace('jpg', 'tiff');
		} else if(result.assetList[i].metadata.type === 'image/png') {
			output = output.replace('jpg', 'png');
		}
		await downloadFile(result.assetList[i].downloadUri, output);
	}


	console.log('All done!');
})();