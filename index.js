if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const PORT = 8080;
const cors = require("cors");

const mongoose = require("mongoose");
const dbUrl = process.env.MONGO_DB_URL

// ROUTES
const gifsRoute = require("./routes/gifs")
const userRoute = require("./routes/users")
const accountsRoute = require("./routes/accounts")

// Setting up connection to Database
mongoose.connect(dbUrl || "mongodb://localhost:27017/jiphy")
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
app.use("/users", userRoute)
app.use("/accounts", accountsRoute)

app.get("/", (req, res) => {
    res.status(200).send("THIS IS JIPHY API")
})

app.listen(PORT, console.log(`SERVER RUNNING ON PORT ${PORT}`))



