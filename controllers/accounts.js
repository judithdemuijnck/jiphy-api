const bcrypt = require("bcrypt");
const saltRounds = 12;
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET_KEY;

const User = require("../models/User")
const { sendStatus } = require("../utils/sendStatus")

const defaultAvatar = "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80";
const loginError = "Incorrect username or password. Please try again."

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
            .populate("friends")
        if (matchedUser) {
            const isValid = await bcrypt.compare(password, matchedUser.password)
            if (isValid) {
                res.send(sendData(matchedUser, "logged in"))
            } else {
                sendStatus(res, 401, loginError)
            }
        } else {
            sendStatus(res, 401, loginError)
        }
    } catch (err) {
        console.error(err)
        // SE: Good practice: We're writing these 3 lines quite a lot - could we declare a function that we pass a status code and message to instead?
        // JdM: Did you mean like this, or did you have sth else in mind?
        sendStatus(res, 500, "Something went wrong.")
        // res.status(401).send({
        //     flash: "Incorrect username or password. Please try again."
        // })
    }
}

const registerUser = async (req, res) => {
    const { username, email, password } = req.body
    const hashedPw = await bcrypt.hash(password, saltRounds)
    try {
        const newUser = new User({ username, email, password: hashedPw, profilePic: { url: defaultAvatar, filename: "default Avatar" } })
        await newUser.save();
        res.send(sendData(newUser, "signed up"))
    } catch (err) {
        console.error(err)
        sendStatus(res, 401, "Username or email address already in use. Please try again.")
    }
}

module.exports = { loginUser, registerUser }