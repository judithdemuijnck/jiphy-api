const BaseJoi = require("joi")
const sanitizeHtml = require("sanitize-html")

// JdM: I took this extension from a previous project/tutorial
// but I'm not sure it's working, I can still submit html through input fields
// but also, if I submit html it does not get executed or rendered
// so I'm confused

// SE: It might be that react is sanitising this for you - it has tools inbuilt to make sure that it automatically escapes HTML tags when submitting forms in order to reduce the risk of HTML injection
// I've tried it in postman.com and I can trigger the error message below with the body: 
// {
//     "username": "<html></html>",
//     "password": "test12345"
// }

const extension = (joi) => ({
    type: "string",
    base: joi.string(),
    messages: {
        "string.escapeHTML": "{{#label}} must not include HTML!"
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error("string.escapeHTML", { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension)

const loginSchema = Joi.object({
    username: Joi.string().required().escapeHTML(),
    password: Joi.string().required().escapeHTML()
})

const registrationSchema = Joi.object({
    username: Joi.string().required().escapeHTML(),
    password: Joi.string().required().escapeHTML(),
    email: Joi.string().email().required().escapeHTML()
})

const editUserSchema = Joi.object({
    username: Joi.string().escapeHTML(),
    email: Joi.string().email().escapeHTML(),
    location: Joi.string().escapeHTML(),
    description: Joi.string().escapeHTML()
})

module.exports = { loginSchema, registrationSchema, editUserSchema }