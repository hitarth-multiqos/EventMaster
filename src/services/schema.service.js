
exports.generateSchema = (moduleName) => `const mongoose = require('mongoose');
const dateFormat = require('../helpers/dateFormat.helper');
const constants = require('../../config/constants');

const ${moduleName}Schema = new mongoose.Schema({
    status: {
        type: Number,
        default: constants.STATUS.ACTIVE,
        index: true
    },
   title: {
        type: String,
        trim: true,
        index: true
    },
    description: {
        type: String,
    },
    createdAt: {
        type: Number,
        index: true
    },
    updatedAt: {
        type: Number,
        index: true
    },
    deletedAt: {
        type: Number,
        default: null,
        index: true
    }
});

${moduleName}Schema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

${moduleName}Schema.pre('findOneAndUpdate', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

${moduleName}Schema.pre('updateOne', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});


const ${moduleName} = mongoose.model('${moduleName}', ${moduleName}Schema);
module.exports = ${moduleName};`