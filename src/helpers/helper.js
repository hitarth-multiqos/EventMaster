const path = require('path');
const fs = require('fs');
const { IMAGE_LINK } = require('../../config/key');
const fsExtra = require('fs-extra'); // Because plain fs is too vanilla for your advanced copying needs.
const archiver = require('archiver'); // For zipping

module.exports.toUpperCase = (str) => {
    if (str?.length) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    return '';
};

module.exports.validationMessageKey = (apiTag, error) => {
    let key = this.toUpperCase(error.details[0].context.key);
    let type = error.details[0].type.split('.');
    type[1] = type[1] === 'empty' ? 'required' : type[1];
    type = this.toUpperCase(type[1]);
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

// Recursively delete a folder and all its contents
async function deleteFolderRecursive(folderPath) {
    try {
        const files = fs.readdirSync(folderPath);

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                await deleteFolderRecursive(filePath);
            } else {
                fs.unlinkSync(filePath);
            }
        }

        fs.rmdirSync(folderPath);
    } catch (err) {
        console.error(`Error deleting folder ${folderPath}:`, err);
    }
}

module.exports.deleteFile = async (data) => {
    if (!data.name) return;

    try {
        if (process.env.STORAGE === 's3') {
            // Handle S3 deletion logic here (if needed)
        } else {
            const targetPath = path.join(__dirname, `../../${data.folderName}/${data.name}`);
            console.log('targetPath', targetPath);
            if (fs.existsSync(targetPath)) {
                const stats = fs.statSync(targetPath);

                if (stats.isFile()) {
                    // Delete file
                    console.log('File deleted at:', new Date().toLocaleString(), targetPath);
                    fs.unlinkSync(targetPath);
                } else if (stats.isDirectory()) {
                    // Delete folder and its contents
                    await deleteFolderRecursive(targetPath);
                    console.log('Folder deleted at:', new Date().toLocaleString(), targetPath);
                }
            }
        }
    } catch (err) {
        console.error('Error in deleteFile:', err);
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
                        deleteLocalFile(folderName, x.filename);
                    });
                }
            });
        }
    } catch (err) {
        console.log('Error(deleteFilesIfAnyValidationError)', err);
    }
}

module.exports.createDir = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            fs.closeSync(fs.openSync(filePath, 'w+'));
            return true;
        }
    } catch (err) {
        console.log('Error(createDir): ', err);
        return false;
    }
}

module.exports.writeProjectFile = (projectPath, folderName, fileName, content) => {
    try {

        let pathToFile = !folderName ? [projectPath, fileName] : [projectPath, folderName, fileName];

        if (fs.existsSync(path.join(...pathToFile))) {
            fs.writeFileSync(path.join(...pathToFile), content, { flag: 'w+', encoding: 'utf-8' })
        } else {
            if (folderName) this.createDir(path.join(projectPath, folderName));
            fs.writeFileSync(path.join(...pathToFile), content, { flag: 'w+', encoding: 'utf-8' })
        }

    } catch (err) {
        console.log(`Error(writeProjectFile)`, err);
    }
}

module.exports.makeFolderOnLocal = (fileUploadPath) => {
    if (!fs.existsSync(fileUploadPath)) {
        fs.mkdirSync(fileUploadPath, { recursive: true });
    }
};

module.exports.copyFolder = async (source, destination) => {
    try {
        // Check if source exists, because obviously, copying from nowhere won't work.
        if (!fsExtra.pathExistsSync(source)) {
            throw new Error(`Source folder does not exist: ${source}`);
        }

        // Copy the folder and its contents
        await fsExtra.copy(source, destination);
        console.log(`Successfully copied from "${source}" to "${destination}".`);
    } catch (error) {
        console.error(`Failed to copy folder: ${error.message}`);
    }
}

// Function to create ZIP file
exports.createZipFile = async (sourceFolder, zipFilePath) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Delete existing ZIP if it exists
            try {
                await access(zipFilePath, fs.constants.F_OK);
                await unlink(zipFilePath);
            } catch (error) {
                // File doesn't exist, no need to delete
            }

            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                console.log(`ZIP file created: ${zipFilePath} (${archive.pointer()} bytes)`);
                resolve();
            });

            archive.on('error', (err) => reject(err));

            archive.pipe(output);
            archive.directory(sourceFolder, false);
            archive.finalize();
        } catch (err) {
            console.log('Error(createZipFile)', err);
            reject(err);
        }
    });
}