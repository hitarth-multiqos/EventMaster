const mongoose = require('mongoose');
const dateFormat = require('../helpers/dateFormat.helper');
const constants = require('../../config/constants');

let schema = {
    title: {
        type: String,
        index: true,
        required: true
    },
    description: {
        type: String,
        index: false
    },
    slug: {
        type: String,
        index: true
    },
    isSponsored: {
        type: Boolean,
        default: false,
        index: true
    },
    eventType: {
        type: String,
        index: true,
        required: true
    },
    language: [{
        type: String,
    }],
    startTime: { type: Number, index: true },
    endTime: { type: Number, index: true },
    eventDuration: { type: String },
    price: { type: Number },
    currency: {
        type: String,
        index: false
    },
    images: [{ type: String, index: true }],
    video: { type: String, index: false },
    thumbnail: { type: String },
    status: {
        type: String,
        default: constants.EVENT_STATUS.IN_REVIEW,
        enum: Object.values(constants.EVENT_STATUS),
        index: true
    },
    totalTickets: { type: Number },
    venue: { type: String },
    city: { type: mongoose.Types.ObjectId, ref: 'city', index: true },
    link: { type: String },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
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
    deletedAt: {
        type: Number,
        default: null,
        index: true
    }
}

const eventSchema = new mongoose.Schema(schema);

//Output data to JSON
eventSchema.methods.toJSON = function () {
    let user = this;
    let userObject = user.toObject();
    return userObject;
};

eventSchema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

eventSchema.pre('findOneAndUpdate', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

eventSchema.pre('updateOne', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

eventSchema.pre('updateMany', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

eventSchema.pre('insertMany', async function (next, document) {
    document.forEach(x => {
        x.createdAt = dateFormat.setCurrentTimestamp();
        x.updatedAt = dateFormat.setCurrentTimestamp();
    });
    next();
});

const Event = mongoose.model('event', eventSchema);
module.exports = Event;