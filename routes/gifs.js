const express = require("express");
const router = express.Router();

const gifs = require("../controllers/gifs")

const { isLoggedIn } = require("../middleware")


router.route("/")
    .get(gifs.searchGifs)


router.route("/favorites")
    .get(isLoggedIn, gifs.seeFavoriteGifs)
    .post(isLoggedIn, gifs.favoriteGif)

module.exports = router


