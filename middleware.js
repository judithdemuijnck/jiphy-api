const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET_KEY;

module.exports.isLoggedIn = (req, res, next) => {
    const recoveredToken = req.headers.token
    try {
        // SE: Praise: This is great Jude! An understanding of JWTs will go a long way. I was asked this in a recent SENIOR interview :)
        const decodedToken = jwt.verify(recoveredToken, jwtSecret)
        res.locals.loggedInUserId = decodedToken.userId
        next()
    } catch (err) {
        console.log("error while validating token")
        console.log(err)
        // SE: Good practice: you need to return these statements - otherwise the next middleware will start running!
        res.status(401).send({ flash: "You need to be logged in to do this." })
    }
}

module.exports.isAuthorized = (req, res, next) => {
    const { userId } = req.params
    if (res.locals.loggedInUserId === userId) {
        next()
    } else {
        // SE: Good practice: you need to return these statements - otherwise the next middleware will start running!
        res.status(403).send({ flash: "You are not authorized to do this." })
    }
}