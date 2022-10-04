const express = require("express");
const router = express.Router();

const { isLoggedIn, isAuthorized } = require("../middleware")

const User = require("../models/User")

const bcrypt = require("bcrypt");
const saltRounds = 12;
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET_KEY;

const defaultAvatar = "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80";

const multer = require("multer");
const { storage } = require("../config/cloudinaryConfig");
const upload = multer({ storage });

router.route("/")
    .get(isLoggedIn, async (req, res) => {
        try {
            const matchedUser = await User.findOne({ _id: res.locals.loggedInUserId }).populate("friends")
            res.send({ user: { ...matchedUser._doc, password: undefined } })
        } catch (err) {
            console.log("ERROR")
            res.status(401).send({ error: "Token invalid/missing. Please login again" })
            // do sth in client --> log user out / clear token / throw 401 error / send flash
        }
    })

router.route("/login")
    .post(async (req, res) => {
        const { username, password } = req.body;
        const matchedUser = await User.findOne({ username: username }).populate("friends")
        const isValid = await bcrypt.compare(password, matchedUser.password)
        console.log("login request received");
        if (isValid) {
            const currentToken = jwt.sign({ userId: matchedUser._id }, jwtSecret, { expiresIn: 604800 })
            res.send({
                token: currentToken,
                //spreads contents into user without password
                user: { ...matchedUser._doc, password: undefined }
            })
        } else {
            res.status(401).send({
                error: "Incorrect username or password. Please try again."
            })
            // send error message -- like a flash?
        }
    })

router.route("/register")
    .post(async (req, res) => {
        const { username, email, password } = req.body
        console.log("register request received")
        const hashedPw = await bcrypt.hash(password, saltRounds)
        const newUser = new User({ username, email, password: hashedPw, profilePic: { url: defaultAvatar, filename: "default Avatar" } })
        await newUser.save();
        const currentToken = jwt.sign({ userId: newUser._id.toHexString() }, jwtSecret, { expiresIn: 604800 })
        res.send({
            token: currentToken,
            user: { ...newUser._doc, password: undefined }
        })
    })

router.route("/:userId")
    .get(isLoggedIn, async (req, res) => {
        const { userId } = req.params;
        try {
            const matchedUser = await User.findOne({ _id: userId }).populate("friends")
            res.send({ user: { ...matchedUser._doc, password: undefined } })
        } catch (err) {
            console.log(err)
            res.status(404).send({ error: "User not found" })
        }
    })


router.route("/:userId/edit")
    // CHANGE INTO PUT REQUEST
    .post(isLoggedIn, isAuthorized, upload.single("profilePic"), async (req, res) => {
        const { userId } = req.params;

        try {
            const matchedUser = await User.findOneAndUpdate({ _id: userId }, req.file ? { profilePic: { url: req.file.path, filename: req.file.originalname } } : req.body, { new: true }).populate("friends")
            res.send({
                user: { ...matchedUser._doc, password: undefined }
            })
        } catch (err) {
            console.log("ERROR")
            console.log(err)
            res.status(400).send({ error: "Something went wrong" })
        }
    })



router.route("/:userId/friend")
    //CHANGE INTO PATCH REQUEST
    .get(isLoggedIn, async (req, res) => {
        const { userId } = req.params;
        console.log("friend request received")
        try {
            // matchedUser --> logged in User making the request
            const matchedUser = await User.findOne({ _id: res.locals.loggedInUserId }).populate("friends")
            // selectedUser --> User that has been requested
            const selectedUser = await User.findOne({ _id: userId }).populate("friends")
            if (matchedUser.friends?.some(friend => friend._id.toHexString() === selectedUser._id.toHexString()) || selectedUser.friends?.some(friend => friend._id.toHexString() === matchedUser._id.toHexString())) {
                matchedUser.friends.pull(selectedUser)
                selectedUser.friends.pull(matchedUser)
            } else {
                matchedUser.friends.push(selectedUser)
                selectedUser.friends.push(matchedUser)
            }
            // IS THERE A BETTER WAY FOR THE OBJECTS TO INTERACT? MONGOOSE.SCHEMA.TYPES.OBJECTID
            await matchedUser.save()
            await selectedUser.save()

            res.send({
                // currently I'm sending password in friends array --> FIX THIS
                selectedUser: { ...selectedUser._doc, password: undefined },
                matchedUser: { ...matchedUser._doc, password: undefined }
            })
        } catch (err) {
            console.log(err)
            res.send("something went wrong")
        }
    })

module.exports = router