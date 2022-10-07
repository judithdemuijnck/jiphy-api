const express = require("express");
const router = express.Router();

const { isLoggedIn, isAuthorized } = require("../middleware")

const User = require("../models/User")

const multer = require("multer");
const { storage } = require("../config/cloudinaryConfig");
const upload = multer({ storage });

const user = require("../controllers/user")

router.route("/")
    .get(isLoggedIn, user.getCurrentUserData)

router.route("/:userId")
    .get(isLoggedIn, user.getUserData)
    .put(isLoggedIn, isAuthorized, upload.single("profilePic"), user.editUserData)

router.route("/:userId/friends")
    .get(isLoggedIn, user.getFriends)
    .patch(isLoggedIn, user.editFriends)

module.exports = router