const fs = require('fs');
const Jimp = require('jimp');
const QrCode = require('qrcode-reader');
const jsBarcodeReader = require('javascript-barcode-reader');

const images = [
	'./rawoutput/figures/fileoutpart0.png',
	'./rawoutput/figures/fileoutpart1.png',
	'./rawoutput/figures/fileoutpart2.png',
	'./rawoutput/figures/fileoutpart3.png'
];



(async () => {

	
	for(i of images) {
		console.log(i);
		let qrresult = await getQRCode(i);
		console.log(`for ${i}, result: ${JSON.stringify(qrresult)}`);
		let bcresult = await getBarcode(i);
		console.log(`for ${i}, result: ${JSON.stringify(bcresult)}`);
	}
	

})();

async function getQRCode(path) {

	let result = await Jimp.read(path);
	let qr = new QrCode();

	return new Promise((resolve, reject) => {
		qr.callback = (err, res) => {
			if(err) {
				/*
				You get err on non-valid QR codes and possibly
				other reasons, for now we just say its not a QR
				*/
				resolve({isQR:false});
			}
			resolve({isQR:true, result:res.result});
		};
		qr.decode(result.bitmap);
	});
}

async function getBarcode(path) {
	console.log(path);
	let result = await jsBarcodeReader({ 
		barcode:'code-128',
		image:path
	});
	return result;

}


