const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET_KEY;

module.exports.isLoggedIn = (req, res, next) => {
    const recoveredToken = req.headers.token
    try {
        const decodedToken = jwt.verify(recoveredToken, jwtSecret)
        res.locals.loggedInUserId = decodedToken.userId
        next()
    } catch (err) {
        console.log("error while validating token")
        res.status(401).send({ error: "Token invalid/missing. Please try again." })
    }
}

module.exports.isAuthorized = (req, res, next) => {
    const { userId } = req.params
    if (res.locals.loggedInUserId === userId) {
        next()
    } else {
        res.status(403).send({ error: "You are not authorized to do this." })
    }
}