const mongoose = require('mongoose');
const dateFormat = require('../helpers/dateFormat.helper');

const countrySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            index: true
        },
        countryCode: { type: String },
        dialingCode: { type: String },
        flag: { type: String },
        status: {
            type: Number,
            default: 1,
            enum: [1, 2, 3],
            index: true
        },
        createdAt: {
            type: Number,
            index: true
        },
        updatedAt: {
            type: Number,
            index: true
        },
    }
);

countrySchema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

countrySchema.pre('findOneAndUpdate', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

countrySchema.pre('updateOne', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

countrySchema.pre('updateMany', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

const Country = mongoose.model('country', countrySchema);
module.exports = Country;
