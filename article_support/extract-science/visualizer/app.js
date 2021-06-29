document.addEventListener('DOMContentLoaded', init, false);
async function init() {

	// fetch the data
	let req = await fetch('./data.json');
	let data = await req.json();

	/*
	Transform the data:
		Right now we've got 20ish years of 12 months of N stars and their report.
		For our line graph, we want to show changes over time for each star so we need 
		change our data such that it is an array of stars, each star has an array of reports (luminance + date)
		the dates become our labels
	*/

	let stars = [];
	let labels = [];
	for(let i=0;i<data.length;i++) {
		let year = data[i].year;
		let monthData = data[i].data;
		//each iteration of starData is a month
		for(let x=0; x<monthData.length; x++) {
			let starData = monthData[x];
			for(let y=0;y<starData.length;y++) {
				let star = starData[y].NAME;
				let luminosity = parseFloat(starData[y].LUMINOSITY,10);
				let dateStr = year + '/' + (x+1);

				let existingStar = stars.findIndex( s => s.name === star);
				if(existingStar >= 0) {
					stars[existingStar].data.push({luminosity, date:dateStr});
				} else {
					stars.push({
						name:star,
						data:[{luminosity, date:dateStr}] 
					});
				}
				//i failed at the simpler logic of this
				if(!labels.includes(dateStr)) labels.push(dateStr);
			}
		}
	}

	let chartData = {};
	chartData.labels = labels;
	chartData.datasets = [];
	stars.forEach(s => {
		chartData.datasets.push({
			label: s.name,
			data:s.data.map(d => d.luminosity),
			borderColor: dynamicColors()
		});
	});


	let ctx = document.querySelector('#startChart').getContext('2d');
	new Chart(ctx, {
		type:'line',
		data: chartData
	});

}

// credit: https://jsfiddle.net/5kLbasqp/26/
function dynamicColors() {
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return "rgb(" + r + "," + g + "," + b + ")";
}