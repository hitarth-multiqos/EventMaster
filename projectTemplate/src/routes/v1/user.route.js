const express = require('express');
const router = express.Router();
const { validMulterUploadMiddleware, uploadImage } = require('../../middleware/uploadImage');

const userController = require('../../controllers/v1/user.controller');
const userValidation = require('../../validations/user.validation');
const { validatorFunction } = require('../../helpers/responseHelper');
const { userAuth, organiserAccess } = require('../../middleware/verifyToken');

router.get('/', (req, res) => res.send('Welcome to user route'));

router.post('/register', validMulterUploadMiddleware(uploadImage), userValidation.registerValidator, validatorFunction, userController.register);
router.post('/login', userValidation.loginValidation, validatorFunction, userController.login);
router.post('/social-login', userController.socialLoginRegisterNew);
router.post('/verify-user', userValidation.verifyUser, validatorFunction, userController.verifyUser);
router.post('/resend-otp', userValidation.forgotPasswordValidation, validatorFunction, userController.resendOtp);
router.post('/forgot-password', userValidation.forgotPasswordValidation, validatorFunction, userController.forgotPassword);
router.post('/reset-password', userValidation.resetPasswordValidation, validatorFunction, userController.resetPassword);
router.post('/view-profile', userAuth, userController.viewProfile);
router.post('/edit-profile', validMulterUploadMiddleware(uploadImage), userAuth, userValidation.editUserValidation, validatorFunction, userController.editProfile);
router.post('/change-password', userAuth, userValidation.changePasswordValidation, validatorFunction, userController.changePassword);
router.post('/setting', userAuth, userController.userSetting);
router.post('/logout', userAuth, userController.logOut);
router.post('/delete-account', userAuth, userController.deleteAccount);
router.post("/guest-login", userValidation.guestLoginValidation, validatorFunction, userController.guestLogin);

module.exports = router;