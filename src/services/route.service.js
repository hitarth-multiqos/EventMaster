exports.generateRoute = (moduleName)=>`const express = require('express');
const router = express.Router();
const ${moduleName}Controller = require('../../controllers/v1/${moduleName}.controller');

router.get('/', (req, res) => res.send('Welcome to ${moduleName} route'));

router.post('/add-edit-${moduleName}', ${moduleName}Controller.addEdit${moduleName});
router.post('/view-${moduleName}', ${moduleName}Controller.view${moduleName});
router.post('/list-${moduleName}', ${moduleName}Controller.list${moduleName});
router.post('/delete-${moduleName}', ${moduleName}Controller.delete${moduleName});

module.exports = router;
`;