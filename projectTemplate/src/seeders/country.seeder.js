const Country = require('../models/country.model');
const dateFormat = require('../helpers/dateFormat.helper');

module.exports = {
    run: () =>
        new Promise((resolve) => {
            (async () => {
                let countryData = require('../../countries.json');
                if (countryData && countryData.length > 0) {
                    countryData = countryData.map(x => {
                        return {
                            name: x.name.common,
                            countryCode: x.cca2,
                            dialingCode: `${x.idd.root}${x.idd.suffixes[0]}`,
                            flag: x.flag,
                            createdAt: dateFormat.setCurrentTimestamp(),
                            updatedAt: dateFormat.setCurrentTimestamp()
                        }
                    });
                    let insertedIds = await Country.insertMany(countryData);
                    console.log('insertedIds', insertedIds);
                }
                console.log('-------> Done');
                resolve(true);
            })();
        }),
};
