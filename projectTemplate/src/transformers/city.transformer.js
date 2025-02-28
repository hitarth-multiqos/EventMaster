exports.transformCity = (data) => {
    return {
        cityId: data?._id ? data._id : '',
        name: data?.name ? data.name : '',
    };
};

exports.cityListTransformer = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformCity(a));
        });
    }
    arrayData = data;
    return arrayData;
};
