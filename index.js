if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const PORT = 8080;
const cors = require("cors");

const mongoose = require("mongoose");

// ROUTES
const gifsRoute = require("./routes/gifs")
const userRoute = require("./routes/user")

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

// ROUTES
app.use("/gifs", gifsRoute)
app.use("/user", userRoute)

app.get("/", (req, res) => {
    res.send("Nothing here")
})

app.listen(PORT, console.log(`SERVER RUNNING ON PORT ${PORT}`))





// redirect user/dashboard to current user/:id



//logout after a week - res.status.send 403/401?

// FIND MATCHED USER IN MIDDLEWARE?

// set LOADING for React App

// store gifCache in session/cookies?
// remove isFavorite from gif, handle in client
