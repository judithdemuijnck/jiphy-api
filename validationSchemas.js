const BaseJoi = require("joi")
const sanitizeHtml = require("sanitize-html")

// JdM: I took this extension from a previous project/tutorial
// but I'm not sure it's working, I can still submit html through input fields
// but also, if I submit html it does not get excuted or rendered
// so I'm confused

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