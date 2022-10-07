const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const saltRounds = 12;
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET_KEY;

const User = require("../models/User")

const defaultAvatar = "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80";


router.route("/login")
    .post(async (req, res) => {
        const { username, password } = req.body;
        const matchedUser = await User.findOne({ username: username })
            .populate("friends")
        const isValid = await bcrypt.compare(password, matchedUser.password)
        console.log("login request received");
        if (isValid) {
            const currentToken = jwt.sign({ userId: matchedUser._id }, jwtSecret, { expiresIn: 604800 })
            res.send({
                token: currentToken,
                //spreads contents into user without password
                user: { ...matchedUser._doc, password: undefined },
                flash: "Successfully logged in"
            })
        } else {
            res.status(401).send({
                flash: "Incorrect username or password. Please try again."
            })
            // send error message -- like a flash?
        }
    })

router.route("/register")
    .post(async (req, res) => {
        const { username, email, password } = req.body
        console.log("register request received")
        const hashedPw = await bcrypt.hash(password, saltRounds)
        try {
            const newUser = new User({ username, email, password: hashedPw, profilePic: { url: defaultAvatar, filename: "default Avatar" } })
            await newUser.save();
            const currentToken = jwt.sign({ userId: newUser._id.toHexString() }, jwtSecret, { expiresIn: 604800 })
            res.send({
                token: currentToken,
                user: { ...newUser._doc, password: undefined },
                flash: "Successfully signed up"
            })
        } catch (err) {
            // Is this the correct status code?
            res.status(409).send({
                flash: "Username or email address already in use. Please try again."
            })
        }

    })



module.exports = router;