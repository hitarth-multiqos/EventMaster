const { toUpperCase } = require("../helpers/helper");

exports.generateService = (moduleName) => `const ${moduleName}Model = require('../models/${moduleName}.model');
const {facetHelper,searchHelper,sortBy} = require("../helpers/helper");
let constants = require("../../../config/constants");
const { ObjectId } = require('mongoose').Types;

exports.listView${toUpperCase(moduleName)} = async (data) => {
    try{
        let pipeline = [];
        let query = {
            status: constants.STATUS.ACTIVE
        };

        if (data.${moduleName}Id) {
            query._id = new ObjectId(data.${moduleName}Id)
        }

        pipeline.push(
            {
                $match: query
            }
        );

        if (data.search) {
            let fieldsArray = ["title"];
            pipeline.push(searchHelper(data.search, fieldsArray));
        }
       
        let sort = sortBy(data.sortBy, data.sortKey)
        pipeline.push(
            { $sort: sort },
            facetHelper(Number(data.skip), Number(data.limit))
        );

        const result = await ${moduleName}Model.aggregate(pipeline);
        return result;
    } catch (err) {
     console.log('Error(listView${toUpperCase(moduleName)})',err);
       return false;
    }
}
`;