exports.transformCountry = (data) => {
    return {
        countryId: data?._id ? data._id : '',
        name: data?.name ? data.name : '',
        countryCode: data?.countryCode ? data.countryCode : '',
        dialingCode: data?.dialingCode ? data.dialingCode : '',
        flag: data?.flag ? data.flag : '',
    };
};

exports.countryListTransformer = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformCountry(a));
        });
    }
    arrayData = data;
    return arrayData;
};
