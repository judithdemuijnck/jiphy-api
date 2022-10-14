const express = require("express");
const router = express.Router();

const gifs = require("../controllers/gifs")

const { isLoggedIn, userIsFound } = require("../middleware")


router.route("/")
    .get(gifs.searchGifs)


router.route("/favorites")
    .get(isLoggedIn, userIsFound, gifs.seeFavoriteGifs)
    .post(isLoggedIn, gifs.toggleFavoriteGif)

module.exports = router


