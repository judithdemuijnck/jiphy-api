const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET_KEY;

const User = require("./models/User")
const { createFlashResponse } = require("./utils/createFlashResponse")

const { loginSchema, registrationSchema, editUserSchema } = require("./validationSchemas")

const logger = require("./utils/logger")

const returnValidationError = (response, error) => {
    logger.error(error)
    const msg = error.details.map(el => el.message).join(",")
    return createFlashResponse(response, 400, msg)
}

const isLoggedIn = async (req, res, next) => {
    const recoveredToken = req.headers.token
    try {
        const decodedToken = jwt.verify(recoveredToken, jwtSecret)
        const matchedUser = await User.findById({ _id: decodedToken.userId })
        if (!matchedUser) {
            return createFlashResponse(res, 404, "User not found.")
        } else {
            res.locals.loggedInUserId = decodedToken.userId
            res.locals.loggedInUser = matchedUser
            next()
        }
    } catch (err) {
        console.log("error while validating token")
        logger.error(err)
        return createFlashResponse(res, 401, "You need to be logged in to do this.")
    }
}

const isAuthorized = (req, res, next) => {
    const { userId } = req.params
    if (res.locals.loggedInUserId === userId) {
        next()
    } else {
        return createFlashResponse(res, 403, "You are not authorized to do this.")
    }
}
const userIsFound = async (req, res, next) => {
    const { userId } = Object.keys(req.params).length !== 0 ? req.params : req.query
    try {
        const matchedUser = await User.findOne({ _id: userId })
        if (matchedUser) {
            res.locals.matchedUser = matchedUser;
            next()
        } else {
            return createFlashResponse(res, 404, "User not found.")
        }
    } catch (err) {
        logger.error(err)
        return createFlashResponse(res, 404, "User not found.")
    }
}

const validateLogin = (req, res, next) => {
    const { error } = loginSchema.validate(req.body)
    if (error) {
        return returnValidationError(res, error)
    } else {
        next()
    }
}

const validateRegistration = (req, res, next) => {
    const { error } = registrationSchema.validate(req.body)
    if (error) {
        return returnValidationError(res, error)
    } else {
        next()
    }
}

const validateEditUser = (req, res, next) => {
    const { error } = editUserSchema.validate(req.body)
    if (error) {
        return returnValidationError(res, error)
    } else {
        next()
    }
}

module.exports = { isLoggedIn, isAuthorized, userIsFound, validateLogin, validateRegistration, validateEditUser }