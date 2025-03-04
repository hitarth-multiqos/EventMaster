const { generateDynamicTransformers } = require("../helpers/helper");

exports.generateTransformer = (moduleName) => `
exports.${moduleName}Transformer = (data) => {
    
    let obj =  {
        ${moduleName}Id : data?._id ?  data?._id: '',
        title : data?.title ?  data?.title: '',
        description : data?.description ?  data?.description: '',
        status : data?.status ?  data?.status: 1,
        createdAt : data?.createdAt ?  data?.createdAt: 0,
        updatedAt : data?.updatedAt ?  data?.updatedAt: 0,
    };

    return obj;
};

exports.${moduleName}ViewTransformer = (arrayData) => {
    let data = null;
    if (arrayData) {
        data = this.${moduleName}Transformer(arrayData);
    }
    arrayData = data;
    return arrayData;
};

exports.${moduleName}ListTransformer = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.${moduleName}Transformer(a));
        });
    }
    arrayData = data;
    return arrayData;
};
`;

exports.generateEventTransformer = (schema, type = 'file') => {

    let pathToSchema = schema;
    let { eventSchema } = type == 'file' ? require(pathToSchema) : schema;

    return `const helper = require('../helpers/helper');
    const dateFormat = require('../helpers/dateFormat.helper');

    const eventTransformer = (data) => {
    
        data = JSON.parse(JSON.stringify(data));
    
        let obj = ${generateDynamicTransformers(eventSchema)};
    
       return obj;
    };
    
    const listEventTransformer = (arrayData) => {
        let responseData = [];
    
        if (arrayData.length) {
            responseData = arrayData.map(x => eventTransformer(x));
        }
        return responseData;
    };
    
    
    const eventViewTransformer = (arrayData) => {
        let responseData = null;
        if (arrayData) {
            responseData = eventTransformer(arrayData);
        }
        return responseData;
    };
    
    const endUserEventTransformer = (data) => {
    
        data = JSON.parse(JSON.stringify(data));
    
        let obj = ${generateDynamicTransformers(eventSchema)};

        return obj;
    };
    
    
    const eventEndUserViewTransformer = (arrayData, language = 'en') => {
        let responseData = null;
        if (arrayData) {
            responseData = endUserEventTransformer(arrayData, language);
        }
        return responseData;
    };
    
    const endUserListEventTransform = (arrayData) => {
        let responseData = [];
    
        if (arrayData.length) {
            responseData = arrayData.map(x => endUserEventTransformer(x));
        }
        return responseData;
    };
    
    
    module.exports = {
        eventViewTransformer,
        listEventTransformer,
        eventEndUserViewTransformer,
        endUserListEventTransform,
    };`;
}