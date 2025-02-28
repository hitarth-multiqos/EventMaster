
const path = require('path');
const responseHelper = require('../../helpers/responseHelper');
const constants = require('../../../config/constants');
const helper = require('../../helpers/helper');
const modelService = require('../../services/model.service');
const { generateNewModuleService } = require('../../services/module.service');
const { generateDependencies, generatePackageJSON, generateENV, generateREADME } = require('../../services/other.service');
const { validateDynamicSchema } = require('../../validations/eventSchema.validation')

// Create Project
module.exports.createProject = async (req, res) => {
    try {

        const { projectTitle, eventSchema } = req.body;
        const projectPath = path.join(__dirname, '../../../', "generated_projects", projectTitle);
        const zipFileName = `${projectTitle}.zip`;
        const zipFilePath = path.join(__dirname, '../../../', 'generated_projects', zipFileName);

        const sourceFolder = path.join(__dirname, '../../../', 'projectTemplate');
        const destinationFolder = projectPath;
        await helper.copyFolder(sourceFolder, destinationFolder);

        if (!eventSchema) {

            let pathToConfigFile = path.join(__dirname, '../../../', 'eventschema.json')

            // Create Event Model
            let eventModel = modelService.createEventSchema('event', pathToConfigFile, true);
            helper.writeProjectFile(`${projectPath}/src`, 'models', 'event.model.js', eventModel);
        } else {
            console.log('eventSchema', eventSchema);
            // Validate the input schema
            const schema = validateDynamicSchema();
            const { error, value } = schema.validate(eventSchema, { abortEarly: true });
            console.log('value', value);
            if (error) {
                console.error('❌ Validation Error:', error.details.map((err) => err.message));
                return res.status(constants.WEB_STATUS_CODE.BAD_REQUEST).send({
                    message: error.details.map((err) => err.message)[0],
                    statusCode: constants.WEB_STATUS_CODE.BAD_REQUEST
                })
            } else {
                console.log('✅ Validation Passed:', value);
            }
            // Create Event Model
            let eventModel = modelService.createEventSchema('event', null, true, { eventSchema: value });
            console.log('eventModel', JSON.stringify(eventModel));
            helper.writeProjectFile(`${projectPath}/src`, 'models', 'event.model.js', eventModel);
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