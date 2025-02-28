const constants = require('../../config/constants');
const helper = require('../helpers/helper')

const userTransformer = (data) => {

    if (!(/googleusercontent/i).test(data.profileImage))
        data.profileImage = data?.profileImage ? helper.imageURL(data.profileImage, 'user') : helper.imageURL("userDefaultProfileImage.png", 'user');

    let obj = {
        userId: data?._id ? data._id : '',
        firstName: data?.firstName ? data.firstName : '',
        lastName: data?.lastName ? data.lastName : '',
        email: data?.email ? data.email : '',
        language: data?.language ? data.language : '',
        isVerified: data?.isVerified ? data.isVerified : false,
        profileImage: data?.profileImage ? data.profileImage : '',
        userType: data?.userType ? data?.userType : '',
        status: data?.status ? data.status : 0,
        bio: data?.bio ? data?.bio : '',
        city: data?.city ? data?.city : {},
        socialType: data?.socialType ? data?.socialType : '',
        isSocialUser: data?.isSocialUser ? data?.isSocialUser : false,
    };

    if (obj.userType == constants.USER_TYPE.ORGANIZER) {
        obj.mobileNumber = data?.mobileNumber ? data.mobileNumber : '';
    }

    return obj;

};

module.exports.userProfileTransformer = (arrayData) => {
    let responseData = null;
    if (arrayData) {
        responseData = userTransformer(arrayData);
    }
    return responseData;
};