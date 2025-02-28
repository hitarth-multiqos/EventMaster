const express = require('express');
const router = express.Router();
const { validMulterUploadMiddleware, uploadImage } = require('../../middleware/uploadImage');

const userController = require('../../controllers/v1/user.controller');
const userValidation = require('../../validations/user.validation');
const { validatorFunction } = require('../../helpers/responseHelper');
const { userAuth, organiserAccess } = require('../../middleware/verifyToken');

router.get('/', (req, res) => res.send('Welcome to user route'));

/**
 * @swagger
 * /api/v1/user/register:
 *   post:  
 *     summary: Register a new user
 *     description: This endpoint registers a new user. The user can be an end user or an organizer. It performs validations, sends an OTP for organizers, and creates the user profile.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 format: text
 *                 description: User's First Name
 *                 example: John
 *               lastName:
 *                 type: string
 *                 format: text
 *                 description: User's Last Name
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: 123456
 *               userType:
 *                 type: string
 *                 enum: [user, organizer]
 *                 description: The type of the user registering
 *                 example: organizer
 *               mobileNumber:
 *                 type: string
 *                 description: Organizer's mobile number (required for ORGANIZER)
 *                 example: "+1234567890"
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile image of the organizer (required for ORGANIZER)
 *     parameters:
 *       - in: header
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en]
 *           default: 'en'
 *         description: Language for the response (default is 'en')
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: DATA
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     token:
 *                       type: string
 *                       description: Authentication token for end users
 *       400:
 *         description: Validation error (e.g., missing required fields)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: mobileNumberRequired
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: Something went wrong, please try again
 */
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