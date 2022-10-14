const User = require("../models/User")


// SE: Good practice: Perhaps rename this getUserById?
async function matchUserToDB(userId) {
    const user = await User.findOne({ _id: userId }).populate("friends")
    return user
}

// SE: Good practice: This might be a little brittle! What if we forgot to invoke this at some point? It would be better if Mongoose knew NEVER to send back a password. Heres how you do this.
// Actually I've written the solution in models/User.js
function sendUserData(user) {
    // removes password from populated user.friends
    const userFriends = user.friends.map(friend => ({ ...friend._doc, password: undefined }))
    return { ...user._doc, password: undefined, friends: userFriends }
}

module.exports.getCurrentUserData = async (req, res) => {
    try {
        const matchedUser = await User.findOne({ _id: res.locals.loggedInUserId }).populate("friends")
        res.send({ user: sendUserData(matchedUser) })
    } catch (err) {
        // SE: Good Practice: Think about the severity of this console.log, think about the payload that its logging
        // If you looked at the terminal, would it show you the error?
        // Absolute good practice would be to declare a logging function, even if for now that just writes to the console
        // i.e logger.js
        // const logger = () => ({
        //   error: (error) => console.error(error)
        // })
        console.log("ERROR")
        // SE: Question: Do we know its because the session expired here? I suspect thats more likely in the event that the JWT expires (which is handled in the middleware)
        // I would therefore expect this catch to be in the event the database is borked - which is a 500 status response.
        res.status(401).send({ flash: "Session expired. Please login again." })
    }
}

module.exports.getUserData = async (req, res) => {
    const { userId } = req.params;
    try {
        const matchedUser = await matchUserToDB(userId)
        res.send({ user: sendUserData(matchedUser) })
    } catch (err) {
        // SE: Good practice: So the error you're actually getting here is TypeError: Cannot read properties of null (reading 'friends') - which indicates in sendUserData you're trying to map over something that doesn't exist. 
        // The best practice would be to handle this case in the try block as soon as we know matchedUser is undefined/null.
        // if (!matcheduser) {
        //    res.status(404).send({ flash: "User not found" })
        //
        // SE: Good practice: is console log the right method for an error? 
        console.log(err)
        res.status(404).send({ flash: "User not found" })
    }
}

module.exports.editUserData = async (req, res) => {
    const { userId } = req.params;
    try {
        const matchedUser = await User.findOneAndUpdate(
            { _id: userId },
            req.file ? { profilePic: { url: req.file.path, filename: req.file.originalname } } : req.body,
            { new: true })
            .populate("friends")
        res.send({
            user: sendUserData(matchedUser),
            flash: "Changes successfully made"
        })
    } catch (err) {
        console.log(err)
        res.status(400).send({ flash: "Something went wrong. Please try again." })
    }
}

module.exports.getFriends = async (req, res) => {
    const { userId } = req.params;
    try {
        const matchedUser = await matchUserToDB(userId)
        res.send({ friends: matchedUser.friends })
    } catch (err) {
        console.log(err)
        // SE: Good practice: This catch block won't actually be called if you don't find the user - see line 43 for how to handle this in the try block
        res.status(404).send({ flash: "Couldn't find what you're looking for" })
    }
}

module.exports.editFriends = async (req, res) => {
    // SE: Question: Is this the friends userID? If so maybe do const { userId: targetUserId } = req.params; to make it more explicit
    const { userId } = req.params;
    try {
        const loggedInUser = await matchUserToDB(res.locals.loggedInUserId)
        // selectedUser --> friend requested User
        const selectedUser = await matchUserToDB(userId)
        // SE: Best practice: The next line can be hard to read! It would be better if we moved each part of the if statement into functions, i.e. isLoggedInUserInTargetUserFriends || isTargetUserInLoggedInUserFriends
        if (loggedInUser.friends?.some(friend => friend._id.toHexString() === selectedUser._id.toHexString()) || selectedUser.friends?.some(friend => friend._id.toHexString() === loggedInUser._id.toHexString())) {
            // SE: Best Practice:  I had to go to the docs to see what friends.pull does ! Maybe move into a util function (removeUserFromFriends)
            loggedInUser.friends.pull(selectedUser)
            selectedUser.friends.pull(loggedInUser)
        } else {
            // SE: Best Practice: I had to go to the docs to see what friends.push does ! Maybe move into a util function (addUserToFriends)
            loggedInUser.friends.push(selectedUser)
            selectedUser.friends.push(loggedInUser)
        }
        await loggedInUser.save()
        await selectedUser.save()

        res.send({
            selectedUser: sendUserData(selectedUser),
            loggedInUser: sendUserData(loggedInUser)
        })
    } catch (err) {
        console.log(err)
        // SE: Best Practice: 400 indicates something went wrong with the user request - 500 would be more apt here as its more likely the DB / our code thats messed up
        res.status(400).send({ flash: "Something went wrong" })
    }
}