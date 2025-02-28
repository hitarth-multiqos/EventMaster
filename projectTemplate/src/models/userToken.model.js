const mongoose = require('mongoose');
const dateFormat = require('../helpers/dateFormat.helper');
const constants = require('../../config/constants');

const userTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
            ref: 'User'
        },
        userType: {
            type: Number
        },
        language: {
            type: String,
            default: constants.USER_DEFAULT_LANGUAGE,
            enum: ['en'],
        },
        deviceToken: {
            type: String,
            index: false
        },
        deviceType: {
            type: String,
            index: false
        },
        status: {
            type: Number,
            default: 1,
            enum: [1, 2, 3], //1=Active 2=InActive 3=Deleted
            index: true,
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


userTokenSchema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

userTokenSchema.pre('findOneAndUpdate', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

userTokenSchema.pre('updateOne', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

userTokenSchema.pre('updateMany', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});


const UserToken = mongoose.model('userToken', userTokenSchema);
module.exports = UserToken;