const { toUpperCase } = require("../helpers/helper");

exports.generateController = (moduleName) => `const ${moduleName}Model = require("../../models/${moduleName}.model");
const responseHelper = require("../../helpers/responseHelper");
const helper = require("../../helpers/helper")
const ${moduleName}Transformer = require('../../transformers/${moduleName}.transformer');
const constants = require('../../../config/constants');
const { listView${toUpperCase(moduleName)} } = require('../../services/${moduleName}.service');

exports.addEdit${moduleName} = async (req, res) => {
    try {
        let reqBody = req.body
        let exists${moduleName}, message;

        if (reqBody.${moduleName}Id) {
            exists${moduleName} = await ${moduleName}Model.findOne({ _id: reqBody.${moduleName}Id, status: { $ne: constants.STATUS.DELETED } });
            if (!exists${moduleName}) return responseHelper.successapi(res, res.__('${moduleName}NotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            let ${moduleName} = await ${moduleName}Model.findOne({ _id: { $ne: reqBody.${moduleName}Id }, title: reqBody.title, status: constants.STATUS.ACTIVE });
            if (${moduleName}) return responseHelper.successapi(res, res.__("TitleAlreadyExist"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            message = "${moduleName}Updated"
        } else {
            let ${moduleName} = await ${moduleName}Model.findOne({title:reqBody.title})
            if (${moduleName}) return responseHelper.successapi(res, res.__("TitleAlreadyExist"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            exists${moduleName} = new ${moduleName}Model();
            message = "${moduleName}AddSuccess"
        }

        exists${moduleName}.title = reqBody?.title ? reqBody.title : exists${moduleName}?.title ? exists${moduleName}.title : "";
        exists${moduleName}.description = reqBody?.description ? reqBody.description : exists${moduleName}?.description ? reqBody.description : "";
     
        let new${moduleName} = await exists${moduleName}.save()

        let response = await ${moduleName}Transformer.${moduleName}ViewTransformer(new${moduleName})
        return responseHelper.successapi(res, res.__(message), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response)

    } catch (err) {
        console.log('Error(addEdit${moduleName})', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}

exports.list${moduleName} = async (req, res) => {
    try {
        let reqBody = req.body
        let search = reqBody?.search ? reqBody.search : ''
        const { limitCount, skipCount } = helper.getPageAndLimit(reqBody.page, reqBody.limit);
       
        let list${moduleName}s = await listView${toUpperCase(moduleName)}({
                search: search,
                sortBy: reqBody.sortBy,
                sortKey: reqBody.sortKey,
                skip: skipCount,
                limit: limitCount,
            });
        let response = list${moduleName}s && list${moduleName}s.length > 0 ? ${moduleName}Transformer.${moduleName}ListTransformer(list${moduleName}s[0].data) : [];
        let totalCount = list${moduleName}s && list${moduleName}s.length > 0 && list${moduleName}s[0].totalRecords[0] ? list${moduleName}s[0].totalRecords[0].count : 0

        return responseHelper.successapi(res, res.__("${moduleName}ListFoundSuccess"), constants.META_STATUS.DATA,constants.WEB_STATUS_CODE.OK, response, { totalCount })
    } catch (err) {
     console.log('Error(list${moduleName})',err);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"),constants.WEB_STATUS_CODE.SERVER_ERROR,err)
    }
}

exports.view${moduleName} = async (req, res) => {
    try {
        const reqBody = req.body;

        let existing${moduleName} = await listView${toUpperCase(moduleName)}({
                manualId: reqBody.manualId
            })
            if (existing${moduleName}[0].data.length == 0) return responseHelper.successapi(res, res.__('${moduleName}NotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        const response = ${moduleName}Transformer.${moduleName}ViewTransformer(existing${moduleName}[0].data[0])
            
        return responseHelper.successapi(res, res.__("${moduleName}FoundSuccessfully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);

    } catch (err) {
        console.log('Error(view${moduleName})', err);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR,err);
    }
};


exports.delete${moduleName} = async (req, res) => {
    try {
        const reqBody = req.body;

        const exists${moduleName} = await ${moduleName}Model.deleteOne({ _id: reqBody.${moduleName}Id, status: constants.STATUS.ACTIVE });
        if (!exists${moduleName}) return responseHelper.successapi(res, res.__("${moduleName}NotFound"), constants.WEB_STATUS_CODE.OK);

        return responseHelper.successapi(res, res.__("${moduleName}DeletedSuccessFully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);

    } catch (err) {
        console.log('Error(delete${moduleName})', err);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR,err);
    }
};
`;