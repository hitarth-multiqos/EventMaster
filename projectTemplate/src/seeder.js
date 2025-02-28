require('./app');
require('./connection/db');
const seeder = require('./seeders/seeder');
const promises = [];
seeder.forEach((seed) => {
  console.log('seed', seed);
  promises.push(require(`./seeders/${seed}.seeder.js`).run());
});
Promise.all(promises)
  .then(() => {
    console.log('Seeders completed');
  }, (err) => {
    console.error('Seeder error', err);
  });
