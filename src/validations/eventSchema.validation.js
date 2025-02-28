const Joi = require('joi');
const Types = require('mongoose').SchemaTypes

// Define a function to validate dynamic schemas
exports.validateDynamicSchema = () => {
    // Define valid data types
    const validTypes = Object.keys(Types);

    // Define a Joi schema for each field in the object
    const fieldSchema = Joi.object({
        type: Joi.string()
            .valid(...validTypes)
            .required()
            .messages({ 'any.only': `Invalid type. Allowed types: ${validTypes.join(', ')}` }),

        required: Joi.boolean().required(),

        default: Joi.alternatives()
            .try(Joi.string(), Joi.number(), Joi.boolean(), Joi.array(), Joi.object())
            .optional(),
    });

    // Validate the whole schema dynamically
    return Joi.object().pattern(Joi.string(), fieldSchema);
};

// // Sample dynamic request body
// const sampleSchema = {
//     name: { type: 'string', required: true, default: 'John Doe' },
//     age: { type: 'number', required: true },
//     isAdmin: { type: 'boolean', required: false, default: false },
//     preferences: { type: 'array', required: false, default: [] },
// };

// // Validate the input schema
// const schema = validateDynamicSchema();
// const { error, value } = schema.validate(sampleSchema, { abortEarly: false });

// if (error) {
//     console.error('❌ Validation Error:', error.details.map((err) => err.message));
// } else {
//     console.log('✅ Validation Passed:', value);
// }