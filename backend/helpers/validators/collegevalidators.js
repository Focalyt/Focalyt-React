const Joi = require('joi')
module.exports = {
    register : (data) => {
        return Joi.object({
            email:Joi.string().trim().email().required(),
            collegeName:Joi.string().trim().required(),
            type:Joi.string().trim().required(),
            password:Joi.string().trim().required(),
            confirmPassword:Joi.string().trim().required(),
            mobile: Joi.string().trim().length(10).pattern(/^[0-9]+$/).required(),
            concernedPerson: Joi.string().trim().max(20).required(),
            location: Joi.object({
                                type: Joi.string().valid('Point').required(), // ✅ add kar diya
                                coordinates: Joi.array().items(Joi.number()).length(2).required(), // ✅ add kar diya
                                state: Joi.string().required(),
                                city: Joi.string().required(),
                                refCode: Joi.string().optional(),
                                fullAddress: Joi.string().optional(),
                            }).required(),
        }).validate(data)
    }
}