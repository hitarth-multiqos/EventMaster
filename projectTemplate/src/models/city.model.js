const mongoose = require('mongoose');
const dateFormat = require('../helpers/dateFormat.helper');

const citySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            index: true
        },
        status: {
            type: Number,
            default: 1,
            enum: [1, 2, 3],
            index: true
        },
        stateId: {
            type: mongoose.Types.ObjectId,
            index: false
        },
        createdAt: {
            type: Number,
            index: true
        },
        updatedAt: {
            type: Number,
            index: false
        },
    }
);

citySchema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

citySchema.pre('findOneAndUpdate', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

citySchema.pre('updateOne', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

citySchema.pre('updateMany', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

const City = mongoose.model('city', citySchema);
module.exports = City;
