const City = require('../models/city.model')
const dateFormat = require('../helpers/dateFormat.helper');
const constants = require('../../config/constants');

let citySeeder = () =>
    new Promise((resolve) => {
        (async () => {
            let cityData = require('../../cities.json');
            console.time('City seeder');
            if (cityData && cityData.length > 0) {
                cityData = cityData.map(x => {
                    if (x['name'].trim().length) {

                        let obj = {
                            _id: x['_id']['$oid'],
                            name: x.name,
                            createdAt: dateFormat.setCurrentTimestamp(),
                            updatedAt: dateFormat.setCurrentTimestamp()
                        };
                        (x.stateId) && (obj.stateId = x['stateId']['$oid']);
                        return obj;
                    }
                }).filter(x => x != null);

                // Declare a new array
                let uniqueCityArray = [];

                // Declare an empty object
                let uniqueObject = {};

                // Loop for the array elements
                for (let i in cityData) {

                    // Extract the title
                    objTitle = cityData[i]['name'];

                    // Use the title as the index
                    uniqueObject[objTitle] = cityData[i];
                }

                // Loop to push unique object into array
                for (i in uniqueObject) {
                    uniqueCityArray.push(uniqueObject[i]);
                }

                // console.log('uniqueCityArray', uniqueCityArray);


                let cityNames = uniqueCityArray.map(x => x.name);
                console.log('cityNames', cityNames);
                console.log('cityNamesFind', cityNames.find(x => x == ''));
                let existingCities = await City.countDocuments({ name: { $in: cityNames } });
                console.log('existingCities', existingCities);

                let insertedIds = await City.insertMany(uniqueCityArray);
                console.log('insertedIds', insertedIds);
            }
            console.log('-------> Done');
            console.timeEnd('City seeder');

            resolve(true);
        })();
    });


let clientCitySeeder = () =>
    new Promise((resolve) => {
        (async () => {
            let cityData = require('../../client-city.json');
            console.time('Client City seeder');
            if (cityData && cityData.length > 0) {

                cityData = cityData.map(x => {

                    if (x['Gemeinde\n[Anm. 1]'].trim().length) {

                        let obj = {
                            name: x['Gemeinde\n[Anm. 1]'],
                            createdAt: dateFormat.setCurrentTimestamp(),
                            updatedAt: dateFormat.setCurrentTimestamp(),
                            status: constants.STATUS.ACTIVE
                        };

                        return obj;
                    }

                }).filter(x => x != null);

                // Declare a new array
                let uniqueCityArray = [];

                // Declare an empty object
                let uniqueObject = {};

                // Loop for the array elements
                for (let i in cityData) {

                    // Extract the title
                    objTitle = cityData[i]['name'];

                    // Use the title as the index
                    uniqueObject[objTitle] = cityData[i];
                }

                // Loop to push unique object into array
                for (i in uniqueObject) {
                    uniqueCityArray.push(uniqueObject[i]);
                }

                console.log('uniqueCityArray.length', uniqueCityArray.length);

                let cityNames = uniqueCityArray.map(x => x.name);
                console.log('cityNames', cityNames);

                let existingCities = await City.find({ name: { $in: cityNames } }).lean();
                console.log('existingCities', existingCities.length);
                let duplicateCityArray = [], count = 0, ind = 0;

                for (let index = 0; index < existingCities.length; index++) {
                    const element = existingCities[index];
                    // console.log('element', element);

                    let isExists = uniqueCityArray.findIndex(y => y.name === element.name);
                    ind++;
                    if (isExists != -1) {
                        count++;
                        console.log('duplicateCity', uniqueCityArray[isExists]);
                        duplicateCityArray.push(uniqueCityArray[isExists]);
                        uniqueCityArray.splice(isExists, 1);
                    }
                }

                console.log('ind', ind);
                console.log('count', count);
                console.log('cityData', cityData.length);
                console.log('existingCities', existingCities.length);
                console.log('uniqueCityArray.length', uniqueCityArray.length);
                console.log('cityNames', cityNames.length);
                console.log('duplicateCityArray', duplicateCityArray.length);

                let insertedIds = await City.insertMany(uniqueCityArray);
                console.log('insertedIds', insertedIds);
            }
            console.log('-------> Done');
            console.timeEnd('Client City seeder');

            resolve(true);
        })();
    });


module.exports = {
    // run: clientCitySeeder,
};
