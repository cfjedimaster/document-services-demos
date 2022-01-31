
/*

Just a quick sample for MS image recog only
*/

require('dotenv').config();
const fs = require('fs');
const fetch = require('node-fetch');

const MS_IMAGE_KEY = process.env.MS_IMAGE_KEY;
const MS_IMAGE_ENDPOINT = process.env.MS_IMAGE_ENDPOINT;

(async () => {

	let image = './cat.jpg';
	let info = await getImageInfo(image);
	console.log(JSON.stringify(info,null,'\t'));
	
})();

async function getImageInfo(path) {

	let theUrl = MS_IMAGE_ENDPOINT + 
			'vision/v3.2/analyze?visualFeatures=Categories,Tags,Description&language=en';

	let headers = {
		'Content-Type':'application/octet-stream',
		'Ocp-Apim-Subscription-Key':MS_IMAGE_KEY
	}

	let resp = await fetch(theUrl, {
		method:'post', 
		headers:headers, 
		body:fs.createReadStream(path)
	});

	return await resp.json();

}

