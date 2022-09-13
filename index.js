if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const PORT = 8080;
const cors = require("cors");

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

const gifCache = [];
const favoriteGifs = [];

// MIDDLEWARE
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/", (req, res) => {
    res.send("Nothing here")
})

app.post("/login", (req, res) => {
    console.log("login request received")
    console.log("body", req.body)
    res.send({
        token: "test123"
        // change to JWT eventually
    })
})

app.get("/gifs/search", async (req, res) => {
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
    for (gif of gifData) {
        newGif = {
            id: gif.id,
            searchTerm: searchTerm,
            title: gif.title,
            url: gif.images.original.url,
            isFavorite: false
        }
        gifCache.push(newGif)
    }
    res.send(gifCache);
})

app.get("/gifs/favorites", (req, res) => {
    res.send(favoriteGifs)
})

app.post("/gifs/favorites", (req, res) => {
    const { favoriteGif } = req.body;
    for (gif of gifCache) {
        if (gif.id === favoriteGif.id) {
            gif.isFavorite = !gif.isFavorite;
            if (gif.isFavorite) {
                favoriteGifs.push(gif)
            } else {
                favoriteGifs.splice(favoriteGifs.findIndex(el => el.id === gif.id), 1)
            }
        }
    }
    res.send(favoriteGifs)
})

app.get("/gifs", (req, res) => {
    res.send(gifCache)
})



app.listen(PORT, console.log("SERVER RUNNING ON PORT 8080"))