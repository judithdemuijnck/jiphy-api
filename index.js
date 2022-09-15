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

const mongoose = require("mongoose");
const User = require("./models/User");

const bcrypt = require("bcrypt");
const saltRounds = 12;
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET_KEY;


const gifCache = [];
const favoriteGifs = [];

// Setting up connection to Database
mongoose.connect("mongodb://localhost:27017/jiphy")
    .then(() => console.log("DATABASE CONNECTED"))
    .catch(err => {
        console.log("DB CONNECTION ERROR")
        console.log(err)
    })


// MIDDLEWARE
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/", (req, res) => {
    res.send("Nothing here")
})

app.post("/login", (req, res) => {

    console.log("login request received");
    token = jwt.sign({ username: "test123" }, jwtSecret)
    res.send(token)
})

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body
    console.log("register request received")
    const hashedPw = await bcrypt.hash(password, saltRounds)
    const newUser = new User({ username, email, password: hashedPw })
    await newUser.save();
    res.send({
        username: username
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

const returnedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6InRlc3QxMjMiLCJpYXQiOjE2NjMxNzEzNjd9.rP8bg8padtzXSEY9RW9tVprgAuT_KqWTfNlqgzpzamA"
const decoded = jwt.verify(returnedToken, jwtSecret)
console.log(decoded)