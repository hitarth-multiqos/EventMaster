const multer = require('multer');
const path = require('path');
const responseHelper = require('../helpers/responseHelper');
const constants = require('../../config/constants');
const { makeFolderOnLocal } = require('../helpers/helper');


let imageFieldList = ['profileImage', 'eventImage'];
let videoFieldList = ['eventVideo'];
let imageAndVideoFieldList = ['videoThumbnailPreview'];


//middleware for adding image
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        switch (file.fieldname) {

            case 'profileImage':
                makeFolderOnLocal(constants.USER_PROFILE_IMAGE_UPLOAD_PATH_LOCAL);
                cb(null, path.join(constants.USER_PROFILE_IMAGE_UPLOAD_PATH_LOCAL));
                break;

            case 'eventImage':
                makeFolderOnLocal(constants.EVENTS_IMAGE_UPLOAD_PATH_LOCAL);
                cb(null, path.join(constants.EVENTS_IMAGE_UPLOAD_PATH_LOCAL));
                break;

            case 'eventVideo':
                makeFolderOnLocal(constants.EVENTS_VIDEO_UPLOAD_PATH_LOCAL);
                cb(null, path.join(constants.EVENTS_VIDEO_UPLOAD_PATH_LOCAL));
                break;

            case 'videoThumbnailPreview':
                makeFolderOnLocal(constants.EVENT_THUMBNAIL_PREVIEW_UPLOAD_PATH_LOCAL);
                cb(null, path.join(constants.EVENT_THUMBNAIL_PREVIEW_UPLOAD_PATH_LOCAL));
                break;

            default:
                console.log(`fieldName not found: ${file}`);
                break;
        }
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
});

module.exports.upload = multer({ storage: storage });

module.exports.uploadImage = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024,
    },
    fileFilter(req, file, cb) {

        if (imageFieldList.includes(file.fieldname)) {

            if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/i)) {
                req.files.isFileTypeError = true;
                return cb('validImage', false);
            }
            cb(undefined, true);

        } else if (videoFieldList.includes(file.fieldname)) {

            if (!file.originalname.match(/\.(mp4|mkv)$/i)) {
                req.files.isFileTypeError = true;
                return cb('validVideo', false);
            }
            cb(undefined, true);

        } else if (imageAndVideoFieldList.includes(file.fieldname)) {

            if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|mp4|mkv)$/i)) {
                req.files.isFileTypeError = true;
                return cb('validImageAndVideo', false);
            }
            cb(undefined, true);

        }

    },
}).fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'eventImage', maxCount: 5 },
    { name: 'eventVideo', maxCount: 1 },
    { name: 'videoThumbnailPreview', maxCount: 1 }
]);

module.exports.validMulterUploadMiddleware = (multerUploadFunction) => {
    return (req, res, next) =>
        multerUploadFunction(req, res, (err) => {

            // handle Multer error
            if (err && err.name && err.name === 'MulterError') {
                console.log('Error(validMulterUploadMiddleware)', err);

                if (err.code == 'LIMIT_UNEXPECTED_FILE') {
                    return responseHelper.error(res, res.__('fileLimitExceeded'), constants.WEB_STATUS_CODE.SERVER_ERROR);
                }
                if (err.code == 'LIMIT_FILE_SIZE') {
                    return responseHelper.error(res, res.__('fileSizeUploadLimitExceeded'), constants.WEB_STATUS_CODE.SERVER_ERROR);
                }

                return responseHelper.error(res, res.__('SomethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR);
            }

            if (err) {
                // handle other errors
                console.log('Error(validMulterUploadMiddleware)', err);
                return responseHelper.error(res, res.__(err), constants.WEB_STATUS_CODE.BAD_REQUEST);
            }
            next();
        });
};