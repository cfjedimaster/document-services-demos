/*
I scan the pdf folder to get the file names as well as the NLP data. From the NLP data, I'm 
going to gather a list of people and categories.
*/


const util = require('util');
const glob = util.promisify(require('glob'));
const fs = require('fs/promises');

const INPUT = './pdfs/';
const OUTPUT = './pdfdata.json';

(async () => {

	let result = [];

	let files = await glob(INPUT + '*.pdf');

	for(file of files) {
		console.log(`Checking ${file} to see if it has a json file.`);

		let jsonFile = file.replace('.pdf', '.json');

		let jsonExists = await exists(jsonFile);
		if(jsonExists) {
			let json = JSON.parse(await fs.readFile(jsonFile, 'utf8'));
			let people = gatherPeople(json);
			//console.log('people', people.length);
			let categories = gatherCategories(json);
			//console.log(categories);
			result.push({
				pdf: file, 
				people, 
				categories
			});
		} else console.log(`The data file ${jsonFile} didn't exist so we are skipping.`);
	}

	await fs.writeFile(OUTPUT, JSON.stringify(result));
	console.log(`Done and written to ${OUTPUT}.`);

})();

async function exists(p) {
	try {
		await fs.stat(p);
		return true;
	} catch(e) {
		return false;
	}
}

function gatherPeople(data) {

	let people = data[0].entities.filter(ent => {
		return ent.allTypes.some(type => {
			return type.name === 'person';
		});
	}).map(person => {
		return person.name;
	});

	//https://stackoverflow.com/a/43046408/52160
	return [...new Set(people)];
}

function gatherCategories(data) {

	let categories = [];
	if(data[0].categories['iabv1']) {
		data[0].categories.iabv1.forEach(c => {
			categories.push(c.name);
		});
	}

	if(data[0].categories['iabv2']) {
		data[0].categories.iabv2.forEach(c => {
			categories.push(c.name);
		});
	}

	//https://stackoverflow.com/a/43046408/52160
	return [...new Set(categories)];
}