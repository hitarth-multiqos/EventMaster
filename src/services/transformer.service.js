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