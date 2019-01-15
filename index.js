const moment = require('moment-timezone');
const fetch = require('node-fetch');
require('dotenv').config()

const prometheus = process.env.PROMETHEUS_URL;
const sensorQuery = 'sensor_heatpump_forwards{deviceId="60:01:94:5D:4C:9D"}';
const step = '2m';
const start = '2019-01-12T23:00:00.000Z';
const end = '2019-01-13T23:00:00.000Z';
const compareSensorQuery = 'sensor_outside{deviceId="60:01:94:5D:4C:9D"}';

const fetchArgs = {
	'headers': {
		'Authorization': process.env.AUTHORIZATION_HEADER
	}
}
fetch(`${prometheus}/query_range?query=${sensorQuery}&start=${start}&end=${end}&step=${step}`, fetchArgs).then(res => res.json()).then(result => {
	const values = result.data.result[0].values;
	const ctx = values.reduce((ctx, sample, idx) => {
		const currentSampleValue = sample[1]-0;
		const prevSampleValue = idx ? values[idx-1][1]-0 : values[idx][0];

		if (!ctx.values.length) {
			ctx.values.push(sample);
			return ctx;
		}

		if (currentSampleValue < prevSampleValue) {
			// downwards trend
			ctx.downwards = true;
			if (ctx.downwards && ctx.upwards) {
				ctx.values.push(values[idx-1]);
				ctx.upwards = false;
			}

		} else if (currentSampleValue > prevSampleValue) {
			// upwards trend
			ctx.upwards = true;
		}

		return ctx;

	}, {'values': []});
	return Promise.resolve(ctx);
}).then(ctx => {
	return Promise.all([
		Promise.resolve(ctx), 
		Promise.all(ctx.values.map(sample => {
			return fetch(`${prometheus}/query?query=${compareSensorQuery}&time=${sample[0]}`, fetchArgs).then(res => res.json());
		}))
	])
}).then(data => {
	const ctx = data[0];
	const values = data[1];

	values.forEach((sample, idx) => {
		let temp = values[idx].data.result[0].value[1];
		ctx.values[idx].push(temp);
	})
	ctx.values.forEach(sample => {
		let datetime = moment.unix(sample[0]).tz('Europe/Copenhagen').format('Y-MM-D H:mm:ss');
		let date = moment.unix(sample[0]).tz('Europe/Copenhagen').format('D-MM-Y');
		let time = moment.unix(sample[0]).tz('Europe/Copenhagen').format('H:mm:ss');
		let sampleValue = sample[1];
		let fetchValue = sample[2];
		console.log(`${datetime};${date};${time};${sampleValue};${fetchValue}`);
	})
});

