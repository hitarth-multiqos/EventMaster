const mongoose = require('mongoose');
const { DB_AUTH_URL } = require('../../config/key');

mongoose.connect(DB_AUTH_URL, {
	maxPoolSize: 10
});

mongoose.connection.on('error', (err) => {
	console.log('Database connection err', err);
	throw err;
});

mongoose.connection.on('connected', () => {
	console.log('Connected to database');
	mongoose.syncIndexes().then(() => console.log('Indexes synchronized successfully')).catch(err => console.log('err', err));
});

mongoose.connection.on('connecting', function () {
	console.log('Trying to establish a connection to mongo');
});

mongoose.connection.on('error', function (err) {
	console.log('Connection to mongo failed ' + err);
});

mongoose.connection.on('disconnected', function () {
	console.log('Mongo connection closed');

	mongoose.connect(DB_AUTH_URL, {
		maxPoolSize: 10
	});
});

module.exports = { mongoose }
