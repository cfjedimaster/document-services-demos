const fs = require('fs');

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

let startYear = 1981;
let endYear = 2000;

let starNames = [
	"Albadore", "Barnie", "Camden", "Delphinus", "Ernie", "Foofihagen", "Glados", 
	"Helix", "Icarus", "Juniper", "Kelix", "Lindy", "Madzuga", "Nicronat", "Olicity", 
	"Patronus", "Queen", "Romana", "Silver", "Tritonus"
]

// generate initial values
let stars = [];
for(star of starNames) {
	stars.push({ 
		name: star, 
		luminosity: getRandomArbitrary(20, 50)
	});
}

/*
This is the main array of historical data. 
*/
let records = [];

/*
when generating data, these stars will "trend" upward
*/ 
let upwardStars = ["Romana", "Queen", "Ernie", "Glados", "Camden"];
// and these, downward
let downwardStars = ["Kelix", "Madzuga", "Albadore", "Olicity", "Silver"];

for(let x = startYear; x <= endYear; x++) {

	let yearRecord = {
		year: x, 
		months:[]
	}

	for(let y = 1; y <= 12; y++) {
		console.log(`Generate data for month ${y} of year ${x}`);
		/*
		For each star, we go up a bit or down a bit or both, depending on the name
		*/
		for(star of stars) {
			if(upwardStars.indexOf(star.name) >= 0) {
				star.luminosity += getRandomArbitrary(-0.2, 0.5);
			} else if(downwardStars.indexOf(star.name) >= 0) {
				star.luminosity += getRandomArbitrary(-0.5, 0.2);
			} else {
				star.luminosity += getRandomArbitrary(-0.2, 0.2);
			}
			if(star.luminosity < 0) star.luminosity = 0;
		}

		let data = JSON.parse(JSON.stringify(stars));
		yearRecord.months.push(
			{
				month: y, 
				stars: data
			}
		);
		console.log('for my year, added month '+y);

	}
	records.push(JSON.parse(JSON.stringify(yearRecord)));
}

let output = './records.json';
if(fs.existsSync(output)) fs.unlinkSync(output);
fs.writeFileSync(output, JSON.stringify(records), 'utf-8');
console.log(`Done and output to ${output}`);