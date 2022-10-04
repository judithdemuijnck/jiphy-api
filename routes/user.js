const express = require("express");
const router = express.Router();

const { isLoggedIn, isAuthorized } = require("../middleware")

const User = require("../models/User")

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

router.route("/:userId")
    .get(isLoggedIn, async (req, res) => {
        const { userId } = req.params;
        try {
            const matchedUser = await User.findOne({ _id: userId })
                .populate("friends")
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
            const matchedUser = await User.findOneAndUpdate(
                { _id: userId },
                req.file ? { profilePic: { url: req.file.path, filename: req.file.originalname } } : req.body,
                { new: true })
                .populate("friends")
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