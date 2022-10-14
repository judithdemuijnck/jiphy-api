const express = require("express");
const router = express.Router();

const { isLoggedIn, isAuthorized, userIsFound } = require("../middleware")

const multer = require("multer");
const { storage } = require("../config/cloudinaryConfig");
const upload = multer({ storage });

const user = require("../controllers/users")

router.route("/")
    .get(isLoggedIn, user.getLoggedInUserData)

router.route("/:userId")
    .get(isLoggedIn, userIsFound, user.getUserData)
    .patch(isLoggedIn, isAuthorized, userIsFound, upload.single("profilePic"), user.editUserData)

router.route("/:userId/friends")
    .get(isLoggedIn, userIsFound, user.getFriends)
    .patch(isLoggedIn, userIsFound, user.editFriends)

module.exports = router