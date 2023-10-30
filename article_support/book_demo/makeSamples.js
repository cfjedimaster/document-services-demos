import { glob } from 'glob';
import { makeSample } from './pdfProcessor.js';

// Where to find the original PDFs
const SOURCE_DIR = './sourcePDFs/';
// Where to store the samples
const SAMPLE_DIR = './samplePDFs/';
// How much of a sample should be provide, in pages
const SAMPLE_SIZE = 5;
// The PDF used to prepend to the sample
const PREPEND_PDF = './prepend.pdf';

const pdfFiles = await glob(`${SOURCE_DIR}*.pdf`);

if(pdfFiles.length === 0) {
	console.log('No source PDFs were found, so nothing to do.');
	process.exit();
}

const generatedPDFs = await glob(`${SAMPLE_DIR}*.pdf`);

let pdfsToProcess = pdfFiles.filter(p => {
	let fileNameSource = p.split('/').pop();
	let genFilename = (SAMPLE_DIR + fileNameSource).replace('./','');
	if(generatedPDFs.includes(genFilename)) return false;
	return true;
});

if(pdfsToProcess.length === 0) {
	console.log('All source PDFs have been processed.');
	process.exit();
}

console.log(`There are ${pdfsToProcess.length} PDFs to process.`);
for(let i=0; i<pdfsToProcess.length; i++) {
	let p = pdfsToProcess[i];
	let fileName = SAMPLE_DIR + p.split('/').pop();
	console.log(`Generating a sample from ${p} to ${fileName}`);
	await makeSample(p, PREPEND_PDF, SAMPLE_SIZE, `${fileName}`);
}