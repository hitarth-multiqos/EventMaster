const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const constants = require('../../config/constants');
const sharp = require('sharp');

const { IMAGE_LINK } = require('../../config/key');
const Mailer = require('./Mailer');

module.exports.toUpperCaseValidation = (str) => {
    if (str?.length) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    return '';
};

module.exports.validationMessageKey = (apiTag, error) => {
    let key = this.toUpperCaseValidation(error.details[0].context.key);
    let type = error.details[0].type.split('.');
    type[1] = type[1] === 'empty' ? 'required' : type[1];
    type = this.toUpperCaseValidation(type[1]);
    key = apiTag + key + type;
    return key;
};

module.exports.imageURL = (imageName, folderName, fieldName) => {
    let urlData = '';
    urlData = `${IMAGE_LINK}${folderName}/${imageName}`;

    let userDefaultProfileImagePath = [`public/uploads/${folderName}/userDefaultProfileImage.png`, `public/uploads/${folderName}/userDefaultProfileImage2.png`];
    const pathOfImage = `public/uploads/${folderName}/${imageName}`;

    // Check if the file exists
    if (fs.existsSync(pathOfImage)) {
        return urlData;
    } else {
        if (folderName === "eventsImage") urlData = `${IMAGE_LINK}${folderName}/eventDefaultImage.png`;
        if (folderName === "user") urlData = fs.existsSync(userDefaultProfileImagePath[0]) ? `${IMAGE_LINK}${folderName}/userDefaultProfileImage.png` : `${IMAGE_LINK}${folderName}/userDefaultProfileImage2.png`;
        if (folderName === "admin") urlData = `${IMAGE_LINK}${folderName}/adminDefaultImage.png`;
        return urlData;
    }
};

module.exports.sendOtpEmail = async (req) => {
    let locals = {
        userName: req.firstName + ' ' + req.lastName,
        appname: constants.EMAIL_FROM,
        otp: req.otp,
        email: req.email ? req.email : '',
        baseUrl: req.baseUrl,
    };

    if (req?.eventTitle) locals.eventTitle = req.eventTitle;
    if (req?.organizerLoginLink) locals.organizerLoginLink = req.organizerLoginLink;
    if (req?.eventDetailsLink) locals.eventDetailsLink = req.eventDetailsLink;

    if (req?.password) locals.password = req.password;

    let emailTemplatePath = (req.path);

    const emailBody = await ejs.renderFile(emailTemplatePath, { locals: locals });
    Mailer.sendEmail(req.email, emailBody, req.subject);
};

module.exports.generateOTP = () => {
    let otp = Math.floor(Math.random() * 9000) + 1000;
    otp = parseInt(otp);
    return otp;
};

module.exports.deleteFile = async (data) => {
    if (data.name !== '') {
        if (process.env.STORAGE === 's3') {

        } else {
            const filePath = path.join(
                __dirname,
                `../../public/uploads/${data.folderName}/${data.name}`
            );
            if (fs.existsSync(filePath)) {
                console.log('File deleted at :' + new Date().toLocaleString(), filePath);
                fs.unlinkSync(filePath);
            }
        }
    }
};

module.exports.deleteFilesIfAnyValidationError = async (files) => {
    try {

        if (Object.keys(files)) {
            let field = Object.keys(files);
            console.log('fields->', field);

            field.forEach(eachField => {

                let uploadedFiles = files[eachField];
                console.log('uploadedFiles', uploadedFiles);

                if (uploadedFiles) {
                    uploadedFiles.forEach(x => {

                        let folderName = x.destination.split('/')[x.destination.split('/').length - 1];
                        console.log('folderName ->', folderName);
                        this.deleteFile({ folderName, name: x.filename });
                    });
                }
            });
        }
    } catch (err) {
        console.log('Error(deleteFilesIfAnyValidationError)', err);
    }
}

module.exports.createLocalFile = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            fs.closeSync(fs.openSync(filePath, 'w+'));
            return true;
        }
    } catch (err) {
        console.log('Error(createLocalFile): ', err);
        return false;
    }
}

module.exports.getFileName = async (file) => process.env.STORAGE == 's3' ? file.key : file.filename;

module.exports.getPageAndLimit = (page, limit) => {
    if (!page) page = constants.PAGE;
    if (!limit) limit = constants.LIMIT;
    if (limit === -1) {
        return { limitCount: -1, skipCount: 0 };
    } else {
        let limitCount = limit * 1;
        let skipCount = (page - 1) * limitCount;
        return { limitCount, skipCount };
    }
};

module.exports.facetHelper = (skip, limit) => {
    return {
        $facet: {
            data: [
                {
                    $skip: Number(skip) < 0 ? 0 : Number(skip) || 0,
                },
                {
                    $limit: Number(limit) < 0 ? constants.LIMIT : Number(limit) || constants.LIMIT,
                },
            ],
            totalRecords: [
                {
                    $count: 'count',
                },
            ],
        },
    };
};

module.exports.searchHelper = (searchField, fields) => {
    let orArr = [];
    let search = [];

    searchField = searchField.replace(/[\*()+?[]/g, '');
    searchField = searchField.replace(']', '');
    search[0] = searchField.trim();

    fields.forEach((element1) => {
        search.forEach((element) => {
            orArr.push({ [element1]: { $regex: new RegExp(element, 'i') } });
        });
    });
    return { $match: { $or: orArr } };
};

module.exports.searchHelperForController = (searchField, fields) => {
    let orArr = [];
    let search = [];

    searchField = searchField.replace(/[\*()+?[]/g, '');
    searchField = searchField.replace(']', '');
    search[0] = searchField.trim();

    fields.forEach((element1) => {
        search.forEach((element) => {
            orArr.push({ [element1]: { $regex: new RegExp(element, 'i') } });
        });
    });
    return { $or: orArr };
};

module.exports.sortBy = (sortBy = -1, sortKey = 'createdAt') => {
    let obj = {};
    sortBy = sortBy ? sortBy : -1;
    sortBy = parseInt(sortBy);
    sortKey = sortKey ? sortKey : 'createdAt';
    obj[sortKey] = sortBy;
    return obj;
};

module.exports.makeFolderOnLocal = (fileUploadPath) => {
    if (!fs.existsSync(fileUploadPath)) {
        fs.mkdirSync(fileUploadPath, { recursive: true });
    }
};

module.exports.groupBy = (xs, key) => {
    return xs.reduce((rv, x) => {
        const groupKey = key.split('.').reduce((obj, k) => obj && obj[k], x); // Access nested key
        if (groupKey) {
            (rv[groupKey] = rv[groupKey] || []).push(x);
        }
        return rv;
    }, {});
};

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path, ffprobePath = require('@ffprobe-installer/ffprobe').path,
    ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfprobePath(ffprobePath);
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports.generateThumbnailFromVideo = async (videoPathLocal, thumbnailPathLocal, fileName) => {
    try {

        if (!fs.existsSync(path.join(__dirname, videoPathLocal))) throw new Error('File not found');
        let promise = new Promise((resolve, reject) => {
            ffmpeg(path.join(__dirname, videoPathLocal))
                .on('end', () => {
                    console.log('Thumbnail generated successfully');
                    resolve(true);
                })
                .on('error', (err) => {
                    console.error('Error generating thumbnail:', err);
                    reject(false);
                })
                .screenshots({
                    timestamps: ['50%'],
                    filename: `${fileName}.png`,
                    folder: path.join(__dirname, thumbnailPathLocal), // Set the folder where the thumbnail will be saved
                    size: '785x658',
                });
        });

        let isPromiseFulFilled = await promise;
        console.log('isPromiseFulFilled', isPromiseFulFilled);
        return true;

    } catch (err) {
        console.log('Error(generateThumbnailFromVideo)', err);
        return false;
    }
}

module.exports.delay = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports.updatedObjectFields = (obj1, obj2) => {
    let update = [];
    let obj1Keys = Object.keys(obj1);
    if (!isEmptyObject(obj1) && !isEmptyObject(obj2)) {
        for (let i of obj1Keys) {
            if (obj1[i]?.toString() !== obj2[i]?.toString()) {
                update.push(i);
            }
        }
        return update;
    } else {
        console.log('No updated fields')
        return [];
    }
}

module.exports.compressImage = async (fileName) => {
    try {
        const directoryPath = path.join(__dirname, '../../public/uploads/eventsImage');
        const imageRegex = /\.(jpe?g|png)$/i;

        if (fileName) {
            let currentImagePath = path.join(__dirname, `../../public/uploads/eventsImage/${fileName}`);
            let isFileExists = fs.existsSync(currentImagePath);
            if (isFileExists) {
                await sharp(currentImagePath).webp({ quality: 80 }).toFile(`public/uploads/eventsImage/${fileName.split('.')[0]}.webp`);
            } else {
                console.log('File not found for compressing');
            }
        } else {

            let listOfEventImages = fs.readdirSync(directoryPath);
            listOfEventImages = listOfEventImages.filter(x => imageRegex.test(path.extname(x)))
            for (let i = 0; i < listOfEventImages.length; i++) {
                console.log('listOfEventImages[i]', listOfEventImages[i]);
                console.log(`listOfEventImages(WEBP) - > ${listOfEventImages[i].split('.')[0]}.webp`)
                let isWebpExists = fs.existsSync(`public/uploads/eventsImage/${listOfEventImages[i].split('.')[0]}.webp`);
                console.log('isWebpExists', isWebpExists);
                if (!isWebpExists) {
                    let currentImagePath = path.join(__dirname, `../../public/uploads/eventsImage/${listOfEventImages[i]}`);
                    console.log('currentImagePath', currentImagePath);
                    await sharp(currentImagePath).webp({ quality: 80 }).toFile(`public/uploads/eventsImage/${listOfEventImages[i].split('.')[0]}.webp`);
                }
            }
        }
    } catch (err) {
        console.log('Error(compressImage)', err);
        return false;
    }
}

module.exports.deleteAllWebpImage = async () => {
    try {
        const directoryPath = path.join(__dirname, '../../public/uploads/eventsImage');
        const imageRegex = /\.(webp)$/i;

        let listOfEventImages = fs.readdirSync(directoryPath);
        listOfEventImages = listOfEventImages.filter(x => imageRegex.test(path.extname(x)))
        for (let i = 0; i < listOfEventImages.length; i++) {
            let currentImagePath = path.join(__dirname, `../../public/uploads/eventsImage/${listOfEventImages[i]}`);
            fs.unlinkSync(currentImagePath);
        }
    } catch (err) {
        console.log('Error(deleteAllWebpImage)', err);
        return false;
    }
}

module.exports.getCategory = (key) => key.split('-')[1];

module.exports.generateSlug = (string) => (string).trim().replace(/[^a-zA-Z0-9\s]/g, "").toLowerCase().replace(/\s/g, '-').replace(/\-\-+/g, '-');

module.exports.getCompressedImageUrl = (imageName, folderName = 'eventsImage') => {
    try {

        let urlData = '';
        let ImageName = path.basename(imageName);
        let imageExtension = /\.(jpg|jpeg|png|gif|bmp|tiff|svg)(\?.*)?$/i;
        urlData = `${IMAGE_LINK}${folderName}/${ImageName}`;

        let compressedImageName = ImageName.replace(imageExtension, '.webp')

        const pathOfCompressedImage = `public/uploads/${folderName}/${compressedImageName}`;
        const pathOfImage = `public/uploads/${folderName}/${ImageName}`;

        // Check if the file exists
        if (fs.existsSync(pathOfCompressedImage)) {
            urlData = `${IMAGE_LINK}${folderName}/${compressedImageName}`;
            return urlData;
        } else {
            return urlData;
        }

    } catch (err) {
        console.log(`Error(getCompressedImageUrl)`, err);
    }
}