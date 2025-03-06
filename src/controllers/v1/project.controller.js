
const path = require('path');
const responseHelper = require('../../helpers/responseHelper');
const constants = require('../../../config/constants');
const helper = require('../../helpers/helper');
const modelService = require('../../services/model.service');
const { generateNewModuleService } = require('../../services/module.service');
const { generateDependencies, generatePackageJSON, generateENV, generateREADME } = require('../../services/other.service');
const { generateEventTransformer } = require('../../services/transformer.service');
const fs = require('fs');
const { exec, execSync } = require('child_process');

// Create Project
module.exports.createProject = async (req, res) => {
    try {
        let { projectTitle, useDefault } = req.body;

        if (!projectTitle) {
            return res.status(constants.WEB_STATUS_CODE.BAD_REQUEST).send({
                message: "Project title is required",
                statusCode: constants.WEB_STATUS_CODE.BAD_REQUEST
            });
        }
        if (typeof (projectTitle) != 'string') {
            return res.status(constants.WEB_STATUS_CODE.BAD_REQUEST).send({
                message: "Please enter valid project title",
                statusCode: constants.WEB_STATUS_CODE.BAD_REQUEST
            });
        }

        if (!req?.body?.useDefault) {
            return res.status(constants.WEB_STATUS_CODE.BAD_REQUEST).send({
                message: "Project title is required",
                statusCode: constants.WEB_STATUS_CODE.BAD_REQUEST
            });
        }
        if (typeof (useDefault) != 'string') {
            return res.status(constants.WEB_STATUS_CODE.BAD_REQUEST).send({
                message: "Please enter valid useDefault",
                statusCode: constants.WEB_STATUS_CODE.BAD_REQUEST
            });
        }

        const projectPath = path.join(__dirname, '../../../', "generated_projects", projectTitle);
        const zipFileName = `${projectTitle}.zip`;
        const zipFilePath = path.join(__dirname, '../../../', 'generated_projects', zipFileName);

        const sourceFolder = path.join(__dirname, '../../../', 'projectTemplate');
        const destinationFolder = projectPath;
        await helper.copyFolder(sourceFolder, destinationFolder);

        let schemaFile = req?.file?.path;
        console.log('schemaFile', req?.file);
        console.log('schemaFilePath', schemaFile);
        // Create Event Model
        useDefault = useDefault == 'true' ? true : false;
        let eventModel = modelService.createEventSchema('event', schemaFile, true, useDefault);
        helper.writeProjectFile(`${projectPath}/src`, 'models', 'event.model.js', eventModel);
        if (!useDefault) {

            fs.unlinkSync(`${projectPath}/src/routes/v1/organizer.route.js`);
            fs.unlinkSync(`${projectPath}/src/controllers/v1/organizer.controller.js`);
            fs.unlinkSync(`${projectPath}/src/controllers/v1/endUser.controller.js`);
            fs.unlinkSync(`${projectPath}/src/services/event.service.js`);

            fs.renameSync(`${projectPath}/src/routes/v1/custom-organizer.route.js`, `${projectPath}/src/routes/v1/organizer.route.js`);
            fs.renameSync(`${projectPath}/src/controllers/v1/custom-organizer.controller.js`, `${projectPath}/src/controllers/v1/organizer.controller.js`);
            fs.renameSync(`${projectPath}/src/controllers/v1/custom-endUser.controller.js`, `${projectPath}/src/controllers/v1/endUser.controller.js`);
            fs.renameSync(`${projectPath}/src/services/custom-event.service.js`, `${projectPath}/src/services/event.service.js`);

            helper.deleteFile({ folderName: "generated_projects", name: `${projectTitle}/src/tests` });

            helper.writeProjectFile(`${projectPath}/src`, 'transformers', 'event.transformer.js', generateEventTransformer(schemaFile));
        } else {
            fs.unlinkSync(`${projectPath}/src/routes/v1/custom-organizer.route.js`);
            fs.unlinkSync(`${projectPath}/src/controllers/v1/custom-organizer.controller.js`);
            fs.unlinkSync(`${projectPath}/src/controllers/v1/custom-endUser.controller.js`);
            fs.unlinkSync(`${projectPath}/src/services/custom-event.service.js`);
        }

        helper.writeProjectFile(`${projectPath}`, '', 'dependencies.js', generateDependencies());
        helper.writeProjectFile(`${projectPath}`, '', 'package.json', generatePackageJSON(projectTitle));
        helper.writeProjectFile(`${projectPath}`, '', '.env', generateENV(projectTitle));
        helper.writeProjectFile(`${projectPath}`, '', 'README.md', generateREADME(projectTitle));

        await helper.createZipFile(projectPath, zipFilePath);

        // Generate the download URL
        const downloadUrl = `${req.protocol}://${req.get('host')}/generated_projects/${zipFileName}`;

        setTimeout(() => {
            helper.deleteFile({ name: projectTitle, folderName: 'generated_projects' });
            helper.deleteFile({ name: `${projectTitle}.zip`, folderName: 'generated_projects' });
        }, 60000)

        return responseHelper.successapi(res, res.__('projectCreated'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, { downloadUrl });

    } catch (err) {
        console.log('Error(createProject)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}

module.exports.createNewModule = async (req, res) => {
    try {

        let { projectTitle, moduleName } = req.body;


        if (!projectTitle) {
            return res.status(constants.WEB_STATUS_CODE.BAD_REQUEST).send({
                message: "Project title is required",
                statusCode: constants.WEB_STATUS_CODE.BAD_REQUEST
            });
        }
        if (typeof (projectTitle) != 'string') {
            return res.status(constants.WEB_STATUS_CODE.BAD_REQUEST).send({
                message: "Please enter valid project title",
                statusCode: constants.WEB_STATUS_CODE.BAD_REQUEST
            });
        }

        if (!moduleName) {
            return res.status(constants.WEB_STATUS_CODE.BAD_REQUEST).send({
                message: "Module name is required",
                statusCode: constants.WEB_STATUS_CODE.BAD_REQUEST
            });
        }
        if (typeof (moduleName) != 'string') {
            return res.status(constants.WEB_STATUS_CODE.BAD_REQUEST).send({
                message: "Please enter valid Module name",
                statusCode: constants.WEB_STATUS_CODE.BAD_REQUEST
            });
        }

        moduleName = moduleName.split(',');

        let moduleGenerated = new Array(moduleName.length).fill(false);
        for (let i = 0; i < moduleName.length; i++) {
            const element = moduleName[i];
            let isModuleGenerated = await generateNewModuleService(projectTitle, element)
            moduleGenerated[i] = isModuleGenerated;
        }

        if (moduleGenerated.some(x => !x))
            return responseHelper.successapi(res, res.__('errorInGeneratingModule'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        const projectPath = path.join(__dirname, '../../../', "generated_projects", projectTitle);
        const zipFileName = `${projectTitle}.zip`;
        const zipFilePath = path.join(__dirname, '../../../', 'generated_projects', zipFileName);

        // Create ZIP file
        await helper.createZipFile(projectPath, zipFilePath);

        await helper.deleteFile({ name: projectTitle, folderName: 'generated_projects' });

        // Generate the download URL
        const downloadUrl = `${req.protocol}://${req.get('host')}/generated_projects/${zipFileName}`;
        return responseHelper.successapi(res, res.__('moduleCreated'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, { downloadUrl });

    } catch (err) {
        console.log(`Error(createNewModule)`, err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}