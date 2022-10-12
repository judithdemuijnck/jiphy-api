const User = require("../models/User")

async function matchUserToDB(userId) {
    const user = await User.findOne({ _id: userId }).populate("friends")
    return user
}

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
        console.log("ERROR")
        res.status(401).send({ flash: "Session expired. Please login again." })
    }
}

module.exports.getUserData = async (req, res) => {
    const { userId } = req.params;
    try {
        const matchedUser = await matchUserToDB(userId)
        res.send({ user: sendUserData(matchedUser) })
    } catch (err) {
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
        res.status(404).send({ flash: "Couldn't find what you're looking for" })
    }
}

module.exports.editFriends = async (req, res) => {
    const { userId } = req.params;
    try {
        const loggedInUser = await matchUserToDB(res.locals.loggedInUserId)
        // selectedUser --> friend requested User
        const selectedUser = await matchUserToDB(userId)
        if (loggedInUser.friends?.some(friend => friend._id.toHexString() === selectedUser._id.toHexString()) || selectedUser.friends?.some(friend => friend._id.toHexString() === loggedInUser._id.toHexString())) {
            loggedInUser.friends.pull(selectedUser)
            selectedUser.friends.pull(loggedInUser)
        } else {
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
        res.status(400).send({ flash: "Something went wrong" })
    }
}