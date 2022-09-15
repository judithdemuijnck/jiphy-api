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
        currentToken = jwt.sign({ username: username }, jwtSecret)
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

app.get("/user", async (req, res) => {
    console.log(req.body)
    console.log(req.headers.token)
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
    for (let gif of gifData) {
        newGif = {
            _id: gif.id,
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

app.post("/gifs/favorites", async (req, res) => {
    const { favoriteGif } = req.body;

    // create favorite gifs array & update gif cache
    // this is temp, move all to db & local storage later
    for (let gif of gifCache) {
        if (gif._id === favoriteGif._id) {
            gif.isFavorite = !gif.isFavorite;
            if (gif.isFavorite) {
                favoriteGifs.push(gif)
            } else {
                favoriteGifs.splice(favoriteGifs.findIndex(el => el._id === gif._id), 1)
            }
        }
    }

    // update favorites in DB for user
    // recover token, sent through headers
    const recoveredToken = req.headers.token
    try {
        // get username from token
        const decoded = jwt.verify(recoveredToken, jwtSecret)
        //match username to DB
        // const matchedUser = await User.findOneAndUpdate({ username: decoded.username }, { favoriteGifs: favoriteGif })
        const matchedUser = await User.findOne({ username: decoded.username })
        // add or remove favoriteGif to DB favoriteGifs
        if (matchedUser.favoriteGifs?.some(el => el._id === favoriteGif._id)) {
            matchedUser.favoriteGifs.pull({ _id: favoriteGif._id })
            console.log("executing if")
        } else {
            console.log("executing else")
            favoriteGif.isFavorite = true;
            matchedUser.favoriteGifs.push(favoriteGif)
        }
        await matchedUser.save()
        res.send({
            favorites: favoriteGifs,
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

// const returnedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6InRlc3QxMjMiLCJpYXQiOjE2NjMxNzEzNjd9.rP8bg8padtzXSEY9RW9tVprgAuT_KqWTfNlqgzpzamA"
// const decoded = jwt.verify(returnedToken, jwtSecret)
// console.log(decoded)

// const testToken = jwt.sign({ data: "foobar" }, jwtSecret, { expiresIn: 120 });
// console.log(testToken)
const returnedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiZm9vYmFyIiwiaWF0IjoxNjYzMjQyNzMxLCJleHAiOjE2NjMyNDI4NTF9.UdHHGYB2w7Nyl93-26irzzIdw1ulwaN1oI_1noI7n2M"
try {
    const decoded = jwt.verify(returnedToken, jwtSecret)
    console.log(decoded)
} catch (err) {
    console.log("Token has expired")
}


// set JWT expires in i.e. a week
// when expires, verify throws an error
// probably put in try - catch expression


// connect user to individual user: user/:id
// redirect user/dashboard to current user/:id
// store token in DB, use this to check which user is currently logged in
// send across data from current user to create user/:id
// send token from client to server in header
// should i hash token in DB to make it more secure? probably? ask Sam
// give option to edit profile on your own dashboard
//logout after a week - res.status.send 404/401?
// add friends component, you can click on friends profile and see their favorite gifs
// create edit page
// transfer tempFavorites to user Favorites if they've favorited before they logged in

//figure out how to reroute in React



// BUG when you favorite gif but then search again for the same term gif in search 
// will no longer show up as favorite in gif list but still as fabvorite in favorites

// BUG if i restart react token still exists so I am logged in but user is not saved anywhere
// so currently we are not logged in as user and cannot see user specific items
// need to either sve user to locStorage or make requests api
// make USEEFFECT call ONCE at start of app to setCurrentUser or initialize with state from API call

// DECOUPLE favorites & gifcache & how this is portrayed in react