const bcrypt = require("bcrypt");
const saltRounds = 12;
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET_KEY;

const User = require("../models/User")
const { createFlashResponse } = require("../utils/createFlashResponse")

const defaultAvatar = "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80";
const loginError = "Incorrect username or password. Please try again."

const logger = require("../utils/logger")

async function getDefaultFriend() {
    const friend = await User.findOne({ username: "friend" })
    return friend
}

async function addDefaultFriend(newUser) {
    const defaultFriend = await getDefaultFriend()
    newUser.friends.push(defaultFriend)
    defaultFriend.friends.push(newUser)
    await newUser.save()
    await defaultFriend.save()
}

function createToken(userId) {
    return jwt.sign({ userId: userId.toHexString() }, jwtSecret, { expiresIn: 604800 })
}

function sendData(user, flashMsg) {
    return {
        token: createToken(user._id),
        user: { ...user.toJSON() },
        flash: `Successfully ${flashMsg}`
    }
}

const loginUser = async (req, res) => {
    const { username, password } = req.body;
    try {
        const matchedUser = await User.findOne({ username: username })
        if (matchedUser) {
            const isValid = await bcrypt.compare(password, matchedUser.password)
            if (isValid) {
                res.send(sendData(matchedUser, "logged in"))
            } else {
                createFlashResponse(res, 401, loginError)
            }
        } else {
            createFlashResponse(res, 401, loginError)
        }
    } catch (err) {
        logger.error(err)
        return createFlashResponse(res, 500, "Something went wrong.")
    }
}

const registerUser = async (req, res) => {
    const { username, email, password } = req.body
    const hashedPw = await bcrypt.hash(password, saltRounds)
    try {
        const newUser = new User({ username, email, password: hashedPw, profilePic: { url: defaultAvatar, filename: "default Avatar" } })
        await newUser.save();
        await addDefaultFriend(newUser)
        res.send(sendData(newUser, "signed up"))
    } catch (err) {
        logger.error(err)
        createFlashResponse(res, 401, "Username or email address already in use. Please try again.")
    }
}

module.exports = { loginUser, registerUser }