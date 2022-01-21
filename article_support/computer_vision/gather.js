/*
For my PDFs, I gather together a list and for each, create a sentence of some form based on the image data
I have associated with it. 
*/

const util = require('util');
const glob = util.promisify(require('glob'));
const fsp = require('fs/promises');

// Directory of source PDFs
const INPUT = './pdfs/';


(async () => {

	let result = [];

	let files = await glob(INPUT + '*.pdf');

	console.log(`Going to process ${files.length} PDFs.\n`);

	for(file of files) {

		thisPdf = {
			fileName: file,
			imageData:[]
		};

		let imagesDir = file + '_images/';
		let imagesDirExists = await exists(imagesDir);

		if(imagesDirExists) {
			let dataFiles = await glob(imagesDir + '*.json');
			/*
			For each data file, try to summarize
			*/
			for(let i=0; i<dataFiles.length; i++) {
				let data = JSON.parse(await fsp.readFile(dataFiles[i]));
				let summary = summarize(data);
				thisPdf.imageData.push(summary);
			}

		} 
		result.push(thisPdf);
	}

	console.log(result);
})();


function summarize(d) {
	let result = '';
	if(d.description && d.description.captions) result += 'This image appears to be: '+d.description.captions[0].text;
	if(d.tags) result += '\nThe image may contain: ' + d.tags.reduce((prev, cur) => {
		if(prev !== '') return prev + ', '+cur.name;
		return cur.name;
	}, ''); 

	return result;
}

async function exists(p) {
	try {
		await fsp.stat(p);
		return true;
	} catch(e) {
		return false;
	}
}