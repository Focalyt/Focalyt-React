const Joi = require('joi')
module.exports = {
    register: (data) => {
        return Joi.object({
            name: Joi.string().trim().max(30).required(),
            fatherName: Joi.string().trim().max(30).optional(),
            motherName: Joi.string().trim().max(30).optional(),
            mobile: Joi.string().trim().length(10).pattern(/^[0-9]+$/).required(),
            sex: Joi.string().trim().required(),
            email: Joi.string().trim().email().optional().allow(''),
            dob: Joi.string().trim().optional().allow(''),
            highestQualification: Joi.string().trim().optional().allow(''),
            isExperienced: Joi.boolean().optional(),            
            personalInfo: Joi.object({
                currentAddress: Joi.object({
                    type: Joi.string().valid('Point').required(), // ✅ add kar diya
                    coordinates: Joi.array().items(Joi.number()).length(2).required(), // ✅ add kar diya
                    state: Joi.string().required(),
                    city: Joi.string().required().allow(''),
                    latitude: Joi.number().required(),
                    longitude: Joi.number().required(),
                    refCode: Joi.string().optional(),
                    fullAddress: Joi.string().optional(),
                    sameCurrentAddress: Joi.boolean().optional()
                }).required(),
                permanentAddress: Joi.object({
                    type: Joi.string().valid('Point').required(), // ✅ add kar diya
                    coordinates: Joi.array().items(Joi.number()).length(2).required(), // ✅ add kar diya
                    state: Joi.string().required(),
                    city: Joi.string().required().allow(''),
                    latitude: Joi.number().required(),
                    longitude: Joi.number().required(),
                    refCode: Joi.string().optional(),
                    fullAddress: Joi.string().optional(),
                }).required()

            }).required(), refCode: Joi.string().optional() // ❗refCode ko personalInfo me nahi, root me rakhna chahiye
        }).validate(data)
    },
    userMobile: (data) => {
        return Joi.object({
            mobile: Joi.number().required(),
        }).validate(data)
    }
}
