const mongoose = require("mongoose");

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
    // SE: Good Practice: Could this schema be extracted to its own constant?
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

// SE: See comment in users.js line 10
//const User = mongoose.model("User", userSchema)
// UserSchema.methods.toJSON = function() {
//     var obj = this.toObject();
//     delete obj.password;
//     return obj;
//    }
//module.exports = User

module.exports = mongoose.model("User", userSchema)