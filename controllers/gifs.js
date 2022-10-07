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

module.exports.searchGifs = async (req, res) => {
    const { searchTerm, offset } = req.query;
    giphyConfig.params.q = searchTerm;
    giphyConfig.params.offset = offset ? JSON.parse(offset) : 0
    try {
        const response = await axios.get(giphyUrl, giphyConfig);
        const gifData = []
        for (let gif of response.data.data) {
            newGif = {
                _id: gif.id,
                searchTerm: searchTerm,
                title: gif.title,
                url: gif.images.original.url,
            }
            gifData.push(newGif)
        }
        res.send(gifData);
    } catch (err) {
        console.log(err)
        res.status(500).send({ flash: "Something went wrong" })
    }
}

module.exports.seeFavoriteGifs = async (req, res) => {
    const { userId } = req.query
    try {
        matchedUser = await User.findOne({ _id: userId })
        res.send({ favorites: matchedUser.favoriteGifs })
    } catch (err) {
        console.log(err)
        res.status(404).send({ flash: "User not found" })
    }
}

module.exports.favoriteGif = async (req, res) => {
    const { favoriteGif } = req.body;
    try {
        const matchedUser = await User.findOne({ _id: res.locals.loggedInUserId })
        // add or remove favoriteGif to/from DB favoriteGifs
        if (matchedUser.favoriteGifs?.some(gif => gif._id === favoriteGif._id)) {
            matchedUser.favoriteGifs.pull({ _id: favoriteGif._id })
        } else {
            matchedUser.favoriteGifs.push(favoriteGif)
        }
        await matchedUser.save()
        res.send({
            user: { ...matchedUser._doc, password: undefined }
        })
    } catch (err) {
        console.log(err)
        res.status(400).send({ flash: "Something went wrong" })
    }
}