const { makeFolderOnLocal } = require('../helpers/helper');

exports.run = async () => {
    makeFolderOnLocal('public/uploads/user');
}