const User = require('../../models/user.model');
const UserToken = require('../../models/userToken.model');
const City = require('../../models/city.model');
const bcrypt = require('bcryptjs');
const path = require('path');
const moment = require('moment');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const { ObjectId } = require('mongoose').Types;

const responseHelper = require('../../helpers/responseHelper');
const constants = require('../../../config/constants');
const helper = require('../../helpers/helper');
const userTransformer = require('../../transformers/user.transformer');
const dateFormat = require('../../helpers/dateFormat.helper');
const eventServices = require('../../services/event.service');
const { checkEmailAndNumber } = require('../../services/checkNumberAndEmail');
const { BASE_URL } = require('../../../config/key');

const { schemaForRegisterUser, socialSignUpValidation, socialLoginValidation } = require('../../validations/user.validation');

// Register user
module.exports.register = async (req, res) => {
    try {
        let deviceType = req?.headers?.devicetype ? req.headers.devicetype : constants.DEVICE_TYPE.WEB;

        let reqBody = deviceType == constants.DEVICE_TYPE.APP ? req.query : req.body;

        let emailExiting = await checkEmailAndNumber(reqBody.email);
        if (emailExiting?.error) {
            helper.deleteFilesIfAnyValidationError(req?.files ? req.files : {});
            return responseHelper.successapi(res, res.__(emailExiting.error), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        }

        if (reqBody.userType == constants.USER_TYPE.ORGANIZER && !reqBody.mobileNumber) {
            helper.deleteFilesIfAnyValidationError(req?.files ? req.files : {});
            return responseHelper.error(res, res.__('mobileNumberRequired'), constants.WEB_STATUS_CODE.BAD_REQUEST);
        }

        if (reqBody.userType == constants.USER_TYPE.ORGANIZER && !req?.files?.profileImage) {
            return responseHelper.error(res, res.__('profileImageRequired'), constants.WEB_STATUS_CODE.BAD_REQUEST);
        }

        let userDetails = await User.findOne({ email: reqBody.email, isGuest: true, status: constants.STATUS.ACTIVE, deletedAt: null })
        if (userDetails) {
            userDetails.isGuest = false
        } else {
            userDetails = new User(reqBody);
        }

        userDetails.profileImage = req?.files?.profileImage ? await helper.getFileName(req?.files?.profileImage[0]) : '';
        userDetails.password = await bcrypt.hash(reqBody.password, 10);
        userDetails.isVerified = reqBody.userType == constants.USER_TYPE.END_USER ? true : false
        userDetails.dateOfJoining = dateFormat.setCurrentTimestamp();

        userDetails.language = constants.USER_DEFAULT_LANGUAGE;
        let otp;
        if (reqBody.userType != constants.USER_TYPE.END_USER) {
            // Send otp
            otp = helper.generateOTP();

            userDetails.otp = otp;
            userDetails.otpExpiresAt = dateFormat.addTimeToCurrentTimestamp(constants.OTP_EXPIRE_TIME, 'minutes');
        }

        userDetails = await userDetails.save();

        const addUserTransformer = userTransformer.userProfileTransformer(userDetails);

        //send mail
        if (reqBody.userType != constants.USER_TYPE.END_USER) {
            helper.sendOtpEmail({
                email: addUserTransformer.email,
                firstName: addUserTransformer.firstName,
                lastName: addUserTransformer.lastName,
                otp: otp,
                subject: 'Welcome to event management',
                baseUrl: BASE_URL,
                path: path.join(__dirname, '../../views/emails/', 'otp-verification.ejs'),
            });
        }

        let authToken = await userDetails.generateAuthToken();

        if (reqBody.userType == constants.USER_TYPE.END_USER) {
            return responseHelper.successapi(res, res.__('userRegistered'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, addUserTransformer, { isVerified: true, token: authToken });
        } else {
            return responseHelper.successapi(res, res.__('userRegistered'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, addUserTransformer);
        }
    } catch (err) {
        console.log('Error(register)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}

//Login User
module.exports.login = async (req, res) => {
    try {
        let reqBody = req.body;

        let language = req.header('language') ? req.header('language') : constants.USER_DEFAULT_LANGUAGE;

        if (language == 'null' || language == null) language = constants.USER_DEFAULT_LANGUAGE;

        let alreadyASocailUser = await User.findOne({ email: reqBody.email, isSocialUser: true });
        if (alreadyASocailUser) {
            if (alreadyASocailUser.status === constants.STATUS.INACTIVE)
                return responseHelper.successapi(res, res.__('accountInactive'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            else if (alreadyASocailUser.status === constants.STATUS.ACTIVE) {
                if (alreadyASocailUser.socialType == 'google') message = "accountAlreadyExistsWithGoogle";
                if (alreadyASocailUser.socialType == 'apple') message = "accountAlreadyExistsWithApple";
                return responseHelper.successapi(res, res.__(message), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }
        }

        let user = await User.findByCredentials(reqBody.email, reqBody.password, reqBody.userType);

        if (user === 1 || user == 5) return responseHelper.successapi(res, res.__('accountNotExist'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        if (user === 2) return responseHelper.successapi(res, res.__('emailOrPasswordWrong'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        if (user === 3) message = "accountAlreadyExistsWithGoogle";
        if (user === 4) message = "accountAlreadyExistsWithApple";
        if (user === 3 || user === 4) return responseHelper.successapi(res, res.__(message), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        if (user.status === constants.STATUS.INACTIVE)
            return responseHelper.successapi(res, res.__('accountInactive'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let authToken = await user.generateAuthToken();
        user.language = language;
        await user.save();


        if (user.isVerified === false) {

            // Send otp
            // let otp = 1234 /*await helper.otpFunction();*/
            let otp = helper.generateOTP();
            const expirationTime = dateFormat.addTimeToCurrentTimestamp(constants.OTP_EXPIRE_TIME, 'minutes');

            user.otp = otp;
            user.otpExpiresAt = expirationTime;

            //send mail
            await helper.sendOtpEmail({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                otp: otp,
                subject: 'Welcome to Event Management',
                baseUrl: BASE_URL,
                path: path.join(__dirname, '../../views/emails/', 'otp-verification.ejs'),
                language: language
            });
        }

        user = await user.save();
        user = JSON.parse(JSON.stringify(user));

        if (user?.city) {
            let cityData = await City.findById({ _id: user?.city }).select('name').lean();
            user.city = cityData?.name;
        }

        const response = userTransformer.userProfileTransformer(user);

        if (reqBody?.deviceToken && reqBody?.deviceType) {

            //Store fcm tokens if any
            await UserToken.updateOne(
                {
                    userId: new ObjectId(response.userId),
                    deviceToken: reqBody.deviceToken
                },
                {
                    $set: {
                        userId: response.userId,
                        deviceToken: reqBody.deviceToken,
                        userType: reqBody.userType,
                        language: language,
                        deviceType: reqBody.deviceType,
                        status: constants.STATUS.ACTIVE
                    }
                },
                { upsert: true }
            );
        }

        return responseHelper.successapi(res, res.__('userLoggedInSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response,
            {
                token: authToken,
                isVerified: user.isVerified
            });

    } catch (err) {
        console.log('Error(login)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}

// Social login new
module.exports.socialLoginRegisterNew = async (req, res) => {
    try {

        let language = req.header('language') ? req.header('language') : constants.USER_DEFAULT_LANGUAGE;

        let reqBody = req.body;
        let message = "userLoggedInSuccessfullyViaSocial", isRegistered = false
        let tokenObj
        if (!reqBody.socialType)
            return responseHelper.error(res, res.__('validationSocialLogInTypeRequired'), constants.WEB_STATUS_CODE.BAD_REQUEST);

        let query = { status: { $ne: constants.STATUS.DELETED } }

        if (reqBody.socialType == 'google') query["email"] = reqBody.email
        if (reqBody.socialType == 'apple') query["userIdentifier"] = reqBody.userIdentifier

        let checkExistingUser = await User.findOne(query)

        if (checkExistingUser) {

            console.log('In if conditioon social signin --------------------')

            isRegistered = true;

            if (checkExistingUser && checkExistingUser.status === constants.STATUS.INACTIVE)
                return responseHelper.successapi(res, res.__('accountInactive'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK, null, {
                    isInactive: true,
                    isAlert: reqBody.isAlert
                });

            let validationMessage = await socialLoginValidation(reqBody);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

            if (checkExistingUser.isSocialUser) {
                if (checkExistingUser.socialType !== reqBody.socialType) {
                    if (checkExistingUser.socialType == 'google') message = "accountAlreadyExistsWithGoogle";
                    if (checkExistingUser.socialType == 'apple') message = "accountAlreadyExistsWithApple";
                }
            } else if (checkExistingUser.isGuest) {
                checkExistingUser.socialType = reqBody.socialType
                checkExistingUser.isGuest = false
                checkExistingUser.isVerified = true
                checkExistingUser.isSocialUser = true
                checkExistingUser.dateOfJoining = dateFormat.setCurrentTimestamp();

                await checkExistingUser.save()
            } else {
                message = "accountAlreadyExistsWithThisEmail";

                if (checkExistingUser.userType == constants.USER_TYPE.ORGANIZER) {
                    message = "userIsOrganizer";
                    return responseHelper.successapi(res, res.__(message), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK, null, {
                        isInactive: false,
                        isAlert: reqBody.isAlert
                    });
                }

            }

            tokenObj = {
                isVerified: checkExistingUser.isVerified,
                isRegistered,
                isAlert: reqBody.isAlert,
            }
        } else {

            console.log('In else conditioon social signup --------------------')
            let validationMessage = await socialSignUpValidation(reqBody);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

            if (checkExistingUser) {
                reqBody.firstName = checkExistingUser.firstName;
                reqBody.lastName = checkExistingUser.lastName;
            } else {
                reqBody.firstName = reqBody?.firstName || "";
                reqBody.lastName = reqBody?.lastName || "";
            }

            checkExistingUser = new User(reqBody);
            reqBody.profileImage = reqBody.profileImage;
            reqBody.userType = reqBody.userType || constants.USER_TYPE.END_USER;
            reqBody.socialId = reqBody.sub;
            (reqBody.userIdentifier) && (reqBody.userIdentifier = reqBody.userIdentifier);
            reqBody.isVerified = true;
            reqBody.isSocialUser = true;
            reqBody.dateOfJoining = dateFormat.setCurrentTimestamp();

            checkExistingUser = await User.create(reqBody)

            tokenObj = {
                isVerified: checkExistingUser.isVerified,
                isAlert: reqBody.isAlert,
            }
        }

        tokenObj.token = await checkExistingUser.generateAuthToken();

        const response = userTransformer.userProfileTransformer(checkExistingUser)

        if (reqBody?.deviceToken && reqBody?.deviceType) {

            //Store fcm tokens if any
            await UserToken.updateOne(
                {
                    userId: new ObjectId(response.userId),
                    deviceToken: reqBody.deviceToken
                },
                {
                    $set: {
                        userId: response.userId,
                        deviceToken: reqBody.deviceToken,
                        userType: reqBody.userType,
                        language: language,
                        deviceType: reqBody.deviceType,
                        status: constants.STATUS.ACTIVE
                    }
                },
                { upsert: true }
            );
        }

        return responseHelper.successapi(res, res.__(message), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, tokenObj);

    } catch (err) {
        console.log('Error(socialLoginRegisterNew)', err);
        return responseHelper.error(res, res.__("somethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
};

//Verify user
module.exports.verifyUser = async (req, res) => {
    try {

        let language = req.header('language');

        let reqBody = req.body;
        reqBody.otp = +reqBody.otp;

        let user = await User.findOne({
            email: reqBody.email,
            status: { $ne: constants.STATUS.DELETED }
        });

        if (!user) return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        if (user?.isVerified) {
            const response = userTransformer.userProfileTransformer(user);
            return responseHelper.successapi(res, res.__('userAlreadyVerified'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, { isVerified: user.isVerified, userType: user.userType })
        }

        if (moment().isAfter(user.otpExpiresAt)) return responseHelper.successapi(res, res.__('otpHasBeenExpired'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        if (reqBody.otp !== user.otp) return responseHelper.successapi(res, res.__('invalidOtp'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        user.isVerified = true;
        await user.save();

        let authToken = await user.generateAuthToken();
        const verifyUserTransformer = userTransformer.userProfileTransformer(user);

        if (reqBody?.deviceToken && reqBody?.deviceType) {

            //Store fcm tokens if any
            await UserToken.updateOne(
                {
                    userId: new ObjectId(verifyUserTransformer.userId),
                    deviceToken: reqBody.deviceToken
                },
                {
                    $set: {
                        userId: verifyUserTransformer.userId,
                        userType: verifyUserTransformer.userType,
                        deviceToken: reqBody.deviceToken,
                        language: language,
                        deviceType: reqBody.deviceType,
                        status: constants.STATUS.ACTIVE
                    }
                },
                { upsert: true }
            );
        }

        return responseHelper.successapi(res, res.__('otpVerifiedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, verifyUserTransformer, {
            token: authToken,
            isVerified: user.isVerified,
            userType: user.userType
        });
    } catch (err) {
        console.log('Error(verifyUser)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
};

//Resend-otp
module.exports.resendOtp = async (req, res) => {
    try {

        let language = req.header('language') ? req.header('language') : constants.USER_DEFAULT_LANGUAGE;

        let reqBody = req.body;

        //existing user
        let existingUser = await User.findOne({
            email: reqBody.email,
            deletedAt: null,
            status: { $ne: constants.STATUS.DELETED }
        });

        if (!existingUser)
            return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        if (existingUser && existingUser.status === constants.STATUS.INACTIVE)
            return responseHelper.successapi(res, res.__('userInactive'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        if (existingUser && existingUser?.isSocialUser) {
            let message = existingUser.socialType == 'google' ? 'cannotForgotPasswordAsUserIsGoogleUser' : 'cannotForgotPasswordAsUserIsAppleUser';
            return responseHelper.successapi(res, res.__(message), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        }

        let otp = helper.generateOTP();
        const expirationTime = dateFormat.addTimeToCurrentTimestamp(constants.OTP_EXPIRE_TIME, 'minutes');

        let userDetails = await User.findOneAndUpdate({
            email: reqBody.email,
            status: { $ne: constants.STATUS.DELETED }
        }, { $set: { otp, otpExpiresAt: expirationTime } });

        if (!userDetails)
            return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        helper.sendOtpEmail({
            firstName: userDetails.firstName,
            lastName: userDetails.lastName,
            email: userDetails.email,
            otp: otp,
            subject: 'Resend Verification Code',
            baseUrl: BASE_URL,
            path: path.join(__dirname, '../../views/emails/', 'resend-otp-verification.ejs'),
            language: language
        });

        return responseHelper.successapi(res, res.__('otpSendSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (err) {
        console.log('Error(resendOtp)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
};

//Forgot Password
module.exports.forgotPassword = async (req, res) => {
    try {

        let language = req.header('language');
        let reqBody = req.body;

        //existing user
        let existingUser = await User.findOne({
            email: reqBody.email,
            deletedAt: null,
            status: { $ne: constants.STATUS.DELETED }
        });

        if (!existingUser)
            return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK, null, { isSocialUser: false });
        if (existingUser && existingUser.status === constants.STATUS.INACTIVE)
            return responseHelper.successapi(res, res.__('userInactive'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        if (existingUser && existingUser?.isSocialUser) {
            let message = existingUser.socialType == 'google' ? 'cannotForgotPasswordAsUserIsGoogleUser' : 'cannotForgotPasswordAsUserIsAppleUser';
            return responseHelper.successapi(res, res.__(message), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK, null, { isSocialUser: true });
        }

        //existing user
        let userDetails = await User.findOne({
            email: reqBody.email,
            deletedAt: null,
            status: { $ne: constants.STATUS.DELETED }
        });

        if (!userDetails)
            return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        if (userDetails && userDetails.status === constants.STATUS.INACTIVE)
            return responseHelper.successapi(res, res.__('userInactive'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        //generating otp
        let otp = helper.generateOTP();
        const expirationTime = dateFormat.addTimeToCurrentTimestamp(constants.OTP_EXPIRE_TIME, 'minutes');

        //updating otp
        userDetails.otp = otp;
        userDetails.otpExpiresAt = expirationTime;

        await userDetails.save();

        userDetails = userDetails.toJSON();

        helper.sendOtpEmail({
            firstName: userDetails.firstName,
            lastName: userDetails.lastName,
            email: userDetails.email,
            otp: otp,
            subject: 'Namascape - Reset Password',
            baseUrl: BASE_URL,
            path: path.join(__dirname, '../../views/emails/', 'forgot-password.ejs'),
            language: language
        });

        return responseHelper.successapi(res, res.__('otpSendSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (err) {
        console.log('Error(forgotPassword)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
};

//Reset Password
module.exports.resetPassword = async (req, res) => {
    try {
        let reqBody = req.body;
        reqBody.otp = +reqBody.otp;

        let userDetails = await User.findOne({ email: reqBody.email, status: constants.STATUS.ACTIVE });

        if (!userDetails)
            return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        if (userDetails && userDetails?.isSocialUser) {
            let message = userDetails.socialType == 'google' ? 'cannotForgotPasswordAsUserIsGoogleUser' : 'cannotForgotPasswordAsUserIsAppleUser';
            return responseHelper.successapi(res, res.__(message), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        }
        if (userDetails.otp !== reqBody.otp)
            return responseHelper.successapi(res, res.__('otpNotValid'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        if (moment().isAfter(userDetails.otpExpiresAt, 'x'))
            return responseHelper.successapi(res, res.__('otpHasBeenExpired'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let password = await bcrypt.hash(reqBody.password, 10);

        await User.updateOne({ email: reqBody.email, deletedAt: null }, { $set: { password: password } });

        return responseHelper.successapi(res, res.__('passwordChangedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (err) {
        console.log('Error(resetPassword)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
};

//view-profile
module.exports.viewProfile = async (req, res) => {
    try {

        let language = req.header('language');

        const user = req.user;

        const userProfile = await User.findOne({ _id: user._id, status: constants.STATUS.ACTIVE }).populate({ path: 'city', select: 'name' }).lean();
        if (!userProfile) return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        userProfile.city = userProfile?.city ? userProfile.city : {};
        (userProfile?.dob) && (userProfile.age = parseInt(moment().diff(moment(userProfile.dob, 'x'), 'years', true)));

        const response = userTransformer.userProfileTransformer(userProfile, language);
        return responseHelper.successapi(res, res.__('userProfileFoundSuccessFully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);

    } catch (err) {
        console.log('Error(viewProfile)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
};

//Edit profile
module.exports.editProfile = async (req, res) => {
    try {
        const user = req.user;
        let deviceType = req?.headers?.devicetype ? req.headers.devicetype : constants.DEVICE_TYPE.WEB;
        let reqBody = deviceType === constants.DEVICE_TYPE.WEB ? req.body : req.query;

        let userData = await User.findOne({ _id: user._id, status: constants.STATUS.ACTIVE });

        if (userData.email !== reqBody.email) {
            const existingEmail = await User.findOne({ _id: { $ne: user._id }, email: reqBody.email, status: { $ne: constants.STATUS.DELETED } });
            if (existingEmail) {
                helper.deleteFilesIfAnyValidationError(req?.files ? req.files : {});
                return responseHelper.successapi(res, res.__('emailAlreadyExist'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }
        }

        if (req?.files?.profileImage) {
            if (userData.profileImage !== '') {
                helper.deleteFile({ folderName: 'user', name: userData.profileImage });
            }
            userData.profileImage = await helper.getFileName(req.files.profileImage[0]) || '';
        }

        userData.firstName = reqBody.firstName;
        userData.lastName = reqBody.lastName;
        userData.email = reqBody.email;
        userData.bio = reqBody.bio || '';
        userData.city = reqBody.city || null;
        userData.dob = reqBody.dob || null;

        (userData.userType == constants.USER_TYPE.ORGANIZER) && (userData.mobileNumber = reqBody.mobileNumber || '');

        userData = await userData.save();
        userData = JSON.parse(JSON.stringify(userData));

        if (reqBody?.city) {
            let cityData = await City.findById({ _id: reqBody?.city }).select('name').lean();
            userData.city = cityData;
        }

        const response = userTransformer.userProfileTransformer(userData);
        return responseHelper.successapi(res, res.__('profileEditSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, { isVerified: response.isVerified });
    } catch (err) {
        console.log('Error(editProfile)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
};

//Change Password
module.exports.changePassword = async (req, res) => {
    try {
        let reqBody = req.body;

        let userExist = await User.findOne({ _id: req.user._id, status: constants.STATUS.ACTIVE });
        if (!userExist)
            return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        if (userExist && userExist?.isSocialUser) {
            let message = userExist.socialType == 'google' ? 'cannotForgotPasswordAsUserIsGoogleUser' : 'cannotForgotPasswordAsUserIsAppleUser';
            return responseHelper.successapi(res, res.__(message), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        }

        let isMatch = bcrypt.compareSync(reqBody.oldPassword, userExist.password);
        if (!isMatch)
            return responseHelper.successapi(res, res.__('oldPasswordDoesNotMatch'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        if (reqBody.oldPassword === reqBody.password)
            return responseHelper.successapi(res, res.__('oldPasswordAndNewPasswordCanNotBeSame'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        if (reqBody.password !== reqBody.confirmPassword)
            return responseHelper.successapi(res, res.__('passwordConfirmPasswordNotSame'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let newPassword = await bcrypt.hash(reqBody.password, 10);

        await User.updateOne({ _id: req.user._id }, { password: newPassword });
        return responseHelper.successapi(res, res.__('passwordChangedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (err) {
        console.log('Error(changePassword)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
};

//Setting
module.exports.userSetting = async (req, res) => {
    try {
        const user = req.user;
        const reqBody = req.body;

        let userDetails = await User.findOne({ _id: user._id, status: constants.STATUS.ACTIVE });
        if (!userDetails)
            return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let settingObj = {};
        let responseMessage;

        if (reqBody?.language || reqBody.language === false) {
            settingObj['language'] = reqBody?.language ? reqBody.language : userDetails.language;
            responseMessage = 'YourLanguageUpdated';
            userDetails.language = settingObj.language;
            await UserToken.updateMany({ userId: user._id, status: 1 }, { $set: { language: settingObj.language } });
        }

        userDetails = await userDetails.save();
        const response = userTransformer.userProfileTransformer(userDetails);

        return responseHelper.successapi(res, res.__(responseMessage), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);

    } catch (err) {
        console.log('Error(userSetting)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
};

module.exports.logOut = async (req, res) => {
    try {
        let reqBody = req.body;
        let userId = req.user._id;

        if (reqBody?.deviceToken) {
            await UserToken.updateOne(
                {
                    userId: new ObjectId(userId),
                    deviceToken: reqBody.deviceToken,
                    status: constants.STATUS.ACTIVE,
                },
                {
                    $set: {
                        status: constants.STATUS.DELETED,
                    }
                },
            );
        };

        return responseHelper.successapi(res, res.__('userLogoutSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (err) {
        console.log('Error(logOut)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
};

module.exports.deleteAccount = async (req, res) => {
    try {
        let reqBody = req.body;
        let userId = req.user._id;

        // While deleting account
        // Delete events of that user if he is organizer

        await UserToken.updateMany(
            {
                userId: new ObjectId(userId),
                status: constants.STATUS.ACTIVE,
            },
            {
                $set: {
                    status: constants.STATUS.DELETED,
                }
            },
        );

        const userData = await User.findOneAndUpdate({
            _id: userId
        }, {
            $set: {
                status: constants.STATUS.DELETED, deletedAt: dateFormat.setCurrentTimestamp()
            }
        }, { new: true });


        if (req.user.userType == constants.USER_TYPE.ORGANIZER) {
            eventServices.deleteEvents({ userId: new ObjectId(userId) });
        }

        // Delete his profile image
        if (req.user.profileImage)
            helper.deleteFile({ folderName: 'user', name: req.user.profileImage });

        return responseHelper.successapi(res, res.__('userAccountDeletedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (err) {
        console.log('Error(deleteAccount)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
};


module.exports.guestLogin = async (req, res) => {
    try {
        const reqBody = req.body;

        let checkGuestUserExist = await User.findOne({ email: reqBody.email, status: constants.STATUS.ACTIVE })
        if (checkGuestUserExist?.isGuest === false) {
            let message = 'accountIsAlreadyExist';
            if (checkGuestUserExist.socialType == 'google') message = "accountAlreadyExistsWithGoogle";
            if (checkGuestUserExist.socialType == 'apple') message = "accountAlreadyExistsWithApple";
            return responseHelper.error(res, res.__(message), constants.WEB_STATUS_CODE.OK);
        }

        if (!checkGuestUserExist) {
            reqBody.isGuest = true
            reqBody.userType = constants.USER_TYPE.END_USER
            checkGuestUserExist = await User.create(reqBody)
            await checkGuestUserExist.save()
        }

        const response = {
            userId: checkGuestUserExist._id,
            firstName: checkGuestUserExist.firstName,
            lastName: checkGuestUserExist.lastName,
            email: checkGuestUserExist.email,
            isGuest: checkGuestUserExist.isGuest,
            userType: checkGuestUserExist.userType
        }

        return responseHelper.successapi(res, res.__('guestUserLoginSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);
    } catch (err) {
        console.log('Error(guestLogin)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err)
    }
}