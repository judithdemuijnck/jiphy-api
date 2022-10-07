const express = require("express");
const router = express.Router();

const accounts = require("../controllers/accounts")

router.route("/login")
    .post(accounts.loginUser)

router.route("/register")
    .post(accounts.registerUser)

module.exports = router;