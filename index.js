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
let currentToken

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

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const matchedUser = await User.findOne({ username: username })
    const isValid = await bcrypt.compare(password, matchedUser.password)
    console.log("login request received");
    if (isValid) {
        currentToken = jwt.sign({ username: username }, jwtSecret, { expiresIn: 120 })
        res.send({
            token: currentToken,
            //spreads contents into user without password
            user: { ...matchedUser._doc, password: undefined }
        })
    } else {
        console.log("Incorrect username or password")
        // send error message -- like a flash?
    }
})

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body
    console.log("register request received")
    const hashedPw = await bcrypt.hash(password, saltRounds)
    const newUser = new User({ username, email, password: hashedPw })
    await newUser.save();
    currentToken = jwt.sign({ username: username }, jwtSecret)
    res.send({
        token: currentToken,
        user: { ...newUser._doc, password: undefined }
    })
})

app.get("/verify", async (req, res) => {
    const recoveredToken = req.headers.token
    try {
        const decoded = jwt.verify(recoveredToken, jwtSecret)
        const matchedUser = await User.findOne({ username: decoded.username })
        res.send(matchedUser ? "valid" : "invalid")
    }
    catch (err) {
        console.log("invalid token")
        res.send("invalid")
    }
})

app.get("/user", async (req, res) => {
    const recoveredToken = req.headers.token
    // return "null" as string --> is there anyway I can convert to null? JSON.parse?
    if (recoveredToken !== "null") {
        try {
            const decoded = jwt.verify(recoveredToken, jwtSecret)
            const matchedUser = await User.findOne({ username: decoded.username })
            res.send({ ...matchedUser._doc, password: undefined })
        } catch (err) {
            console.log("ERROR")
            console.log(err)
            res.send("Token invalid, log in again")
            // do sth in client --> log user out / clear token / throw 401 error
        }
    } else {
        res.send({})
    }
})

app.get("/gifs/search", async (req, res) => {
    // grab favorites from currentUser
    const recoveredToken = req.headers.token
    let currentUserFavorites = []
    if (recoveredToken !== "null") {
        try {
            const decoded = jwt.verify(recoveredToken, jwtSecret)
            const matchedUser = await User.findOne({ username: decoded.username })
            currentUserFavorites = matchedUser.favoriteGifs
        }
        catch (err) {
            console.log("Token invalid / user not found")
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

app.get("/gifs/favorites", (req, res) => {
    res.send(favoriteGifs)
})

app.post("/gifs/favorites", async (req, res) => {
    const { favoriteGif } = req.body;

    // recover token, sent through headers
    const recoveredToken = req.headers.token
    try {
        // get username from token
        const decoded = jwt.verify(recoveredToken, jwtSecret)
        //match username to DB
        const matchedUser = await User.findOne({ username: decoded.username })
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
        // DO I NEED TO POPULATE AT SOME POINT? SO REACT HAS ACCESS TO FAVORITES?
    } catch (err) {
        console.log("Problem")
        res.send("Something went wrong")
    }


})

app.get("/gifs", (req, res) => {
    res.send(gifCache)
})




app.listen(PORT, console.log("SERVER RUNNING ON PORT 8080"))

// const testToken = jwt.sign({ data: "foobar" }, jwtSecret, { expiresIn: 120 });




// set JWT expires in i.e. a week
// when expires, verify throws an error
// probably put in try - catch expression


// connect user to individual user: user/:id
// redirect user/dashboard to current user/:id
// store token in DB, use this to check which user is currently logged in
// send across data from current user to create user/:id


// give option to edit profile on your own dashboard
//logout after a week - res.status.send 403/401?
// add friends component, you can click on friends profile and see their favorite gifs
// create edit page


// CATCH mistake - what happens if you get logged out for exired token


// VERIFY TOKEN IN MIDDLEWARE
// FIND MATCHED USER IN MIDDLEWARE?
// FIGURE OUT HOW TO VERIFY TOKEN / LOGOUT/CLEARTOKEN IF TOKEN IS INVALID

