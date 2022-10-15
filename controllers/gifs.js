// SE: nitpick: unused import
// Wider conversation to be had about using ESLint to catch these automatically.
// We can chat about that later on.
const User = require("../models/User.js")
const { sendStatus } = require("../utils/sendStatus")

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

const genericErrorMsg = "Something went wrong."
const userErrorMsg = "User not found."

// JdM: Should I move any of these into a differnt (e.g utils) file/folder?
// SE: Answer: I would argue they're find to be 'colocated' (in same file) for now as theres no reuse between files.
// This indicates to other devs that they're not ready to be used in several places
function isAlreadyInFavorites(user, gif) {
    return user.favoriteGifs?.some(favGif => favGif._id === gif._id)
}

function addToFavorites(user, gif) {
    user.favoriteGifs.push(gif)
}

function removeFromFavorites(user, gif) {
    user.favoriteGifs.pull(gif)
}

const searchGifs = async (req, res) => {
    const { searchTerm, offset } = req.query;
    giphyConfig.params.q = searchTerm;
    giphyConfig.params.offset = offset ? JSON.parse(offset) : 0
    try {
        const response = await axios.get(giphyUrl, giphyConfig);
        // SE: super stuff, remember to check that data exists before calling map on it
        // i.e. response?.data?.data?.map (optional chaining)
        // or response && response.data && response.data.data && response.data.data.map (short circuiting)
        // As an aside, this is where typescript helps - at this point it would tell You:
        // 'It looks like you're calling map on something that can be undefined - please don't do this'
        const gifData = response.data.data.map(gif => {
            return {
                _id: gif.id,
                searchTerm: searchTerm,
                title: gif.title,
                url: gif.images.original.url
            }
        })
        res.send(gifData);
    } catch (err) {
        console.error(err)
        sendStatus(res, 500, genericErrorMsg)
    }
}

const seeFavoriteGifs = (req, res) => {
    try {
        // SE: Question: any reason this can't be const matchedUser? Always better to use const where you're not reassigning the value
        matchedUser = res.locals.matchedUser
        res.send({ favorites: matchedUser.favoriteGifs })
    } catch (err) {
        console.error(err)
        sendStatus(res, 500, genericErrorMsg)
    }
}

const toggleFavoriteGif = async (req, res) => {
    const { favoriteGif } = req.body;
    try {
        const loggedInUser = res.locals.loggedInUser
        if (!loggedInUser) {
            // SE: good practice: great stuff, remember to return sendStatus so the execution stops
            sendStatus(res, 404, userErrorMsg)
        } else {
            if (isAlreadyInFavorites(loggedInUser, favoriteGif)) {
                removeFromFavorites(loggedInUser, favoriteGif)
            } else {
                addToFavorites(loggedInUser, favoriteGif)
            }
            await loggedInUser.save()
            res.send({
                user: { ...loggedInUser.toJSON() }
            })
        }
    } catch (err) {
        console.error(err)
        sendStatus(res, 500, genericErrorMsg)
    }
}

module.exports = { searchGifs, seeFavoriteGifs, toggleFavoriteGif }