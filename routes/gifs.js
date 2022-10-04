const express = require("express");
const router = express.Router();

const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET_KEY;

const User = require("../models/User.js")

const axios = require("axios");
const giphyUrl = "https://api.giphy.com/v1/gifs/search";
const giphyConfig = {
    params: {
        q: "test",
        api_key: process.env.GIPHY_API_KEY,
        limit: 24,
        offset: 0
    }
};

const { isLoggedIn } = require("../middleware")

const gifCache = []
const favoriteGifs = []

router.route("/")
    .get((req, res) => {
        res.send(gifCache)
    })

router.route("/search")
    .get(async (req, res) => {
        // grab favorites from currentUser
        let currentUserFavorites = []

        if (req.headers.token !== "null") {
            try {
                const decoded = jwt.verify(req.headers.token, jwtSecret)
                const matchedUser = await User.findOne({ _id: decoded.userId })
                currentUserFavorites = matchedUser.favoriteGifs
            } catch (err) {
                console.log("error while matching user to DB")
            }
        }


        const { searchTerm } = req.query;
        giphyConfig.params.q = searchTerm;
        if (gifCache.length > 0) {
            if (gifCache[0].searchTerm === searchTerm) {
                giphyConfig.params.offset += 24;
            } else {
                giphyConfig.params.offset = 0;
                gifCache.length = 0;
            }
        }
        const response = await axios.get(giphyUrl, giphyConfig);
        const gifData = response.data.data
        for (let gif of gifData) {
            newGif = {
                _id: gif.id,
                searchTerm: searchTerm,
                title: gif.title,
                url: gif.images.original.url,
                isFavorite: currentUserFavorites.some(el => el._id === gif.id) ? true : false
            }
            gifCache.push(newGif)
        }
        res.send(gifCache);
    })


router.route("/favorites")
    .get((req, res) => {
        res.send(favoriteGifs)
    })
    .post(isLoggedIn, async (req, res) => {
        const { favoriteGif } = req.body;

        try {
            //match ID to DB
            const matchedUser = await User.findOne({ _id: res.locals.loggedInUserId })
            // add or remove favoriteGif to/from DB favoriteGifs
            if (matchedUser.favoriteGifs?.some(gif => gif._id === favoriteGif._id)) {
                matchedUser.favoriteGifs.pull({ _id: favoriteGif._id })
            } else {
                favoriteGif.isFavorite = true;
                matchedUser.favoriteGifs.push(favoriteGif)
            }
            await matchedUser.save()

            // add/remove favorite to/from gifCache
            for (let gif of gifCache) {
                if (gif._id === favoriteGif._id) {
                    gif.isFavorite = !gif.isFavorite;
                    break
                }
            }

            res.send({
                user: { ...matchedUser._doc, password: undefined }
            })

        } catch (err) {
            console.log("Problem")
            res.send("Something went wrong")
        }
    })

module.exports = router


