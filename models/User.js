// store in DB
// access from DB
// create login - hash password, compare to hashed password
// send out JWT
// compare JWT so User only sees their own dashboard

// figure out how to get JWT

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const favoritesSchema = new mongoose.Schema({
    _id: String,
    isFavorite: Boolean,
    searchTerm: String,
    title: String,
    url: String
})

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "You need a username"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "You need a password"],
    },
    email: {
        type: String,
        required: [true, "You need an email address"],
        unique: true
    },
    location: String,
    description: String,
    profilePic: new mongoose.Schema({
        url: String,
        filename: String
    }),
    favoriteGifs: [favoritesSchema],
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
})

module.exports = mongoose.model("User", userSchema)