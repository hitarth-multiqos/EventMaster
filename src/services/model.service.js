module.exports.createEventSchema = (modelName, pathToSchema, prehooks = false, eventBody, useDefault = true) => {
    try {

        let importString = `const mongoose = require('mongoose');
const dateFormat = require('../helpers/dateFormat.helper');
const constants = require('../../config/constants');
const {ObjectId} = require('mongoose').Types;
`;
        if (useDefault) {
            let eventSchema = eventBody ? eventBody?.eventSchema : {};

            schema = eventBody ? eventBody : {
                "title": {
                    "type": "String",
                    "index": true,
                    "required": true
                },
                "description": {
                    "type": "String",
                    "index": false
                },
                "slug": {
                    "type": "String",
                    "index": true
                },
                "isSponsored": {
                    "type": "Boolean",
                    "default": false,
                    "index": true
                },
                "eventType": {
                    "type": "String",
                    "index": true,
                    "required": true
                },
                "language": [
                    {
                        "type": "String"
                    }
                ],
                "startTime": {
                    "type": "Number",
                    "index": true
                },
                "endTime": {
                    "type": "Number",
                    "index": true
                },
                "eventDuration": {
                    "type": "String"
                },
                "price": {
                    "type": "Number"
                },
                "currency": {
                    "type": "String",
                    "index": false
                },
                "images": [
                    {
                        "type": "String",
                        "index": true
                    }
                ],
                "video": {
                    "type": "String",
                    "index": false
                },
                "thumbnail": {
                    "type": "String"
                },
                "status": {
                    "type": "Number",
                    "default": 1,
                    "index": true
                },
                "totalTickets": {
                    "type": "Number"
                },
                "venue": {
                    "type": "String"
                },
                "city": {
                    "type": "ObjectId",
                    "ref": "city",
                    "index": true
                },
                "link": {
                    "type": "String"
                },
                "userId": {
                    "type": "ObjectId",
                    "required": true,
                    "index": true
                },
                "custom": { ...eventSchema },
                "createdAt": {
                    "type": "Number",
                    "index": true
                },
                "updatedAt": {
                    "type": "Number",
                    "index": true
                },
                "deletedAt": {
                    "type": "Number",
                    "default": null,
                    "index": true
                }
            }
        } else {
            let { eventSchema } = require(pathToSchema);
            schema = eventSchema || {};
        }

        let schemaString = JSON.stringify(schema);

        let defineSchemaString = `const eventSchema = new mongoose.Schema(${schemaString});\n`
        let preHookString = `\neventSchema.methods.toJSON = function () {
        let event = this;
        let eventObject = event.toObject();
        return eventObject;
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
});\n`

        let exportStrings = `const Event = mongoose.model("${modelName}", eventSchema);\nmodule.exports = Event;`

        let response = prehooks = true ? importString + defineSchemaString + preHookString + exportStrings : importString + defineSchemaString + exportStrings
        return response;
    } catch (err) {
        console.log(`Error(createEventSchema)`, err);
    }
}