const bcrypt = require("bcrypt");
const saltRounds = 12;
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET_KEY;

const User = require("../models/User")

const defaultAvatar = "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80";

function createToken(userId) {
    return jwt.sign({ userId: userId.toHexString() }, jwtSecret, { expiresIn: 604800 })
}

function sendResponse(User, flashMsg) {
    return {
        token: createToken(User._id),
        //spreads contents into user without password
        user: { ...User._doc, password: undefined },
        flash: `Successfully ${flashMsg}`
    }
}

module.exports.loginUser = async (req, res) => {
    const { username, password } = req.body;
    try {
        const matchedUser = await User.findOne({ username: username })
            .populate("friends")
        const isValid = await bcrypt.compare(password, matchedUser.password)
        if (isValid) {
            res.send(sendResponse(matchedUser, "logged in"))
        } else {
            res.status(401).send({
                flash: "Incorrect username or password. Please try again."
            })
        }
    } catch (err) {
        console.log(err)
        res.status(401).send({
            flash: "Incorrect username or password. Please try again."
        })
    }
}

module.exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body
    const hashedPw = await bcrypt.hash(password, saltRounds)
    try {
        const newUser = new User({ username, email, password: hashedPw, profilePic: { url: defaultAvatar, filename: "default Avatar" } })
        await newUser.save();
        res.send(sendResponse(newUser, "signed up"))
    } catch (err) {
        console.log(err)
        // Is this the correct status code?
        res.status(409).send({
            flash: "Username or email address already in use. Please try again."
        })
    }
}