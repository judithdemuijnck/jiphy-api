if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const PORT = 8080;
const cors = require("cors");

const multer = require("multer");
const { cloudinary, storage } = require("./config/cloudinaryConfig");
const upload = multer({ storage });


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

const defaultAvatar = "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80";

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
    const matchedUser = await User.findOne({ username: username }).populate("friends")
    const isValid = await bcrypt.compare(password, matchedUser.password)
    console.log("login request received");
    if (isValid) {
        currentToken = jwt.sign({ username: username }, jwtSecret, { expiresIn: 604800 })
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
    const newUser = new User({ username, email, password: hashedPw, profilePic: { url: defaultAvatar, filename: "default Avatar" } })
    await newUser.save();
    currentToken = jwt.sign({ username: username }, jwtSecret, { expiresIn: 604800 })
    res.send({
        token: currentToken,
        user: { ...newUser._doc, password: undefined }
    })
})

app.post("/user/edit", upload.single("profilePic"), async (req, res) => {
    console.log(req.body)
    console.log(req.file)

    const recoveredToken = req.headers.token
    try {
        const decoded = jwt.verify(recoveredToken, jwtSecret)
        const matchedUser = await User.findOneAndUpdate({ username: decoded.username }, req.file ? { profilePic: { url: req.file.path, filename: req.file.originalname } } : req.body, { new: true }).populate("friends")
        res.send({
            user: { ...matchedUser._doc, password: undefined }
        })
    } catch (err) {
        console.log("ERROR")
        console.log(err)
        res.send("error")
    }
})

app.get("/user/:userId", async (req, res) => {
    const { userId } = req.params;
    const recoveredToken = req.headers.token;
    //make sure to verifyToken so onöly loggedIn users can get info
    try {
        const decoded = jwt.verify(recoveredToken, jwtSecret)
        const matchedUser = await User.findOne({ _id: userId }).populate("friends")
        res.send({ user: { ...matchedUser._doc, password: undefined } })
    } catch (err) {
        console.log(err)
        res.send(err)
    }
})

app.get("/user/:userId/friend", async (req, res) => {
    const { userId } = req.params;
    const recoveredToken = req.headers.token
    console.log("friend request received")
    try {
        const decoded = jwt.verify(recoveredToken, jwtSecret)
        // matchedUser --> User making the request
        const matchedUser = await User.findOne({ username: decoded.username }).populate("friends")
        // selectedUser --> User that has been requested
        const selectedUser = await User.findOne({ _id: userId }).populate("friends")
        if (matchedUser.friends?.some(friend => friend._id.toHexString() === selectedUser._id.toHexString()) || selectedUser.friends?.some(friend => friend._id.toHexString() === matchedUser._id.toHexString())) {

            matchedUser.friends.pull(selectedUser)
            selectedUser.friends.pull(matchedUser)
        } else {
            matchedUser.friends.push(selectedUser)
            selectedUser.friends.push(matchedUser)
        }
        // IS THERE A BETTER WAY FOR THE OBJECTS TO INTERACT? MONGOOSE.SCHEMA.TYPES.OBJECTID
        await matchedUser.save()
        await selectedUser.save()

        res.send({
            // currently I'm sending password in friends array --> FIX THIS
            selectedUser: { ...selectedUser._doc, password: undefined },
            matchedUser: { ...matchedUser._doc, password: undefined }
        })
    } catch (err) {
        console.log(err)
        res.send("something went wrong")
    }

})

app.get("/user", async (req, res) => {
    const recoveredToken = req.headers.token
    try {
        const decoded = jwt.verify(recoveredToken, jwtSecret)
        const matchedUser = await User.findOne({ username: decoded.username }).populate("friends")
        console.log(matchedUser)
        res.send({ user: { ...matchedUser._doc, password: undefined } })
    } catch (err) {
        console.log("ERROR")
        res.status(401).send({ error: "Token invalid/missing. Please login again" })
        // do sth in client --> log user out / clear token / throw 401 error
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





// redirect user/dashboard to current user/:id



//logout after a week - res.status.send 403/401?


// VERIFY TOKEN IN MIDDLEWARE
// FIND MATCHED USER IN MIDDLEWARE?

// set LOADING for React App
