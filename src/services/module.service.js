const fs = require('fs');
const path = require('path');
const { generateRoute } = require('./route.service');
const { generateService } = require('./moduleService.service');
const { generateSchema } = require('./schema.service');
const { generateController } = require('./controller.service');
const { generateTransformer } = require('./transformer.service');

exports.generateNewModuleService = async (projectName, moduleName) => {
    try {

        let moduleDir = path.join(__dirname, '../../', `generated_projects/${projectName}/src/`)

        let schemaPath = moduleDir + 'models/';
        let routePath = moduleDir + 'routes/v1/';
        let servicePath = moduleDir + 'services';
        let controllerPath = moduleDir + 'controllers/v1/';
        let transformerPath = moduleDir + 'transformers/';

        // Ensure directories exist
        [schemaPath, routePath, servicePath, controllerPath, transformerPath].forEach((dir) => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        const schemaContent = generateSchema(moduleName);
        const routeContent = generateRoute(moduleName);
        const serviceContent = generateService(moduleName);
        const controllerContent = generateController(moduleName);
        const transformerContent = generateTransformer(moduleName);

        fs.writeFileSync(path.join(schemaPath, `${moduleName}.model.js`), schemaContent);
        fs.writeFileSync(path.join(routePath, `${moduleName}.route.js`), routeContent);
        fs.writeFileSync(path.join(servicePath, `${moduleName}.service.js`), serviceContent);
        fs.writeFileSync(path.join(controllerPath, `${moduleName}.controller.js`), controllerContent);
        fs.writeFileSync(path.join(transformerPath, `${moduleName}.transformer.js`), transformerContent);

        return true;

    } catch (err) {
        console.log(`Error(generateNewModuleService)`, err);
        throw new Error('Error in generating new module')
    }
}