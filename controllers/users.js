const User = require("../models/User")
const { sendStatus } = require("../utils/sendStatus")

const genericErrorMsg = "Something went wrong."
// SE: Nitpick: unused
const userErrorMsg = "User not found."

function sendUserData(user) {
    return { user: { ...user.toJSON() } }
}

// JdM: Should I move any of these into a differnt (e.g utils) file/folder?
// SE: Answer: See answer in gifs.js line 21
function removeUserFromFriends(user1, user2) {
    user1.friends.pull(user2)
    user2.friends.pull(user1)
}

function addUserToFriends(user1, user2) {
    user1.friends.push(user2)
    user2.friends.push(user1)
}

function isAlreadyInFriends(user1, user2) {
    const user1IsInUser2Friends = user2.friends?.some(friend => friend._id.toHexString() === user1._id.toHexString())
    const user2IsInUser1Friends = user1.friends?.some(friend => friend._id.toHexString() === user2._id.toHexString())
    return user1IsInUser2Friends || user2IsInUser1Friends
}

const getLoggedInUserData = (req, res) => {
    try {
        const loggedInUser = res.locals.loggedInUser
        res.send(sendUserData(loggedInUser))
    } catch (err) {
        console.error(err)
        sendStatus(res, 500, genericErrorMsg)
    }
}

const getUserData = (req, res) => {
    try {
        const matchedUser = res.locals.matchedUser

        res.send(sendUserData(matchedUser))
    } catch (err) {
        console.error(err)
        // JdM: What is the difference between console.log(error) and console.error(error)?
        // SE: answer: So theres two streams to output that unix operating systems have, SYSOUT and SYSERR. console.log/warn/debug/trace will log to SYSOUT whereas console.error will log to SYSERR
        // In production systems you would actually send an object and not a string, i.e. {"level":"error","message":"Public error to share"}. Then you can filter by the attributes here. 
        // If you're interested we can go into this in greater detail (you don't need to know it in depth now), you can also just scan the pino docs https://github.com/pinojs/pino, which is a JS logging library. 
        sendStatus(res, 500, genericErrorMsg)
    }
}

const editUserData = async (req, res) => {
    try {
        const matchedUser = await User.findOneAndUpdate(
            { _id: res.locals.matchedUser._id },
            req.file ? { profilePic: { url: req.file.path, filename: req.file.originalname } } : req.body,
            { new: true })
        res.send({
            ...sendUserData(matchedUser),
            flash: "Changes successfully made"
        })
    } catch (err) {
        console.error(err)
        sendStatus(res, 500, genericErrorMsg)
    }
}

const getFriends = (req, res) => {
    try {
        const matchedUser = res.locals.matchedUser
        res.send({ friends: matchedUser.friends })
    } catch (err) {
        console.error(err)
        sendStatus(res, 404, "Couldn't find what you're looking for.")
    }
}

const editFriends = async (req, res) => {
    try {
        const targetUser = res.locals.matchedUser
        const loggedInUser = res.locals.loggedInUser
        if (isAlreadyInFriends(targetUser, loggedInUser)) {
            removeUserFromFriends(targetUser, loggedInUser)
        } else {
            addUserToFriends(loggedInUser, targetUser)
        }
        await loggedInUser.save()
        await targetUser.save()

        res.send({
            // SE: question: do you need to spread here? Whats the difference between { ...sendUserData(targetUser).user } and sendUserData(targetUser).user (I'll give you a hint - there might not be one!)
            selectedUser: { ...sendUserData(targetUser).user },
            loggedInUser: { ...sendUserData(loggedInUser).user }
        })
    } catch (err) {
        console.error(err)
        sendStatus(res, 500, genericErrorMsg)
    }
}

module.exports = { getLoggedInUserData, getUserData, editUserData, getFriends, editFriends }
