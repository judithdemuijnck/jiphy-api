const express = require("express");
const router = express.Router();

const accounts = require("../controllers/accounts")

const { validateLogin, validateRegistration } = require("../middleware")

router.route("/login")
    .post(validateLogin, accounts.loginUser)

router.route("/register")
    .post(validateRegistration, accounts.registerUser)

module.exports = router;