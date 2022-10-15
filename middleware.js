const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET_KEY;

const User = require("./models/User")
const { sendStatus } = require("./utils/sendStatus")

module.exports.isLoggedIn = async (req, res, next) => {
    const recoveredToken = req.headers.token
    try {
        const decodedToken = jwt.verify(recoveredToken, jwtSecret)
        const matchedUser = await User.findById({ _id: decodedToken.userId })
        if (!matchedUser) {
            return sendStatus(res, 404, "User not found.")
        } else {
            res.locals.loggedInUserId = decodedToken.userId
            res.locals.loggedInUser = matchedUser
            next()
        }
    } catch (err) {
        console.log("error while validating token")
        console.error(err)
        return sendStatus(res, 401, "You need to be logged in to do this.")
    }
}

module.exports.isAuthorized = (req, res, next) => {
    const { userId } = req.params
    if (res.locals.loggedInUserId === userId) {
        next()
    } else {
        return sendStatus(res, 403, "You are not authorized to do this.")
    }
}

// JdM: Is it ok that I moved this into middleware?
// SE: answer: yeah I believe so - you're only scoping it to certain routes so I don't see any issue here.
module.exports.userIsFound = async (req, res, next) => {
    const { userId } = Object.keys(req.params).length !== 0 ? req.params : req.query
    try {
        const matchedUser = await User.findOne({ _id: userId })
        if (matchedUser) {
            res.locals.matchedUser = matchedUser;
            next()
        } else {
            return sendStatus(res, 404, "User not found.")
        }
    } catch (err) {
        console.error(err)
        // 400 because of faulty userId / wrong format
        // SE: nitpick: is the message right here?
        return sendStatus(res, 400, "There is nothing here.")
    }
}