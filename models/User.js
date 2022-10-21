const mongoose = require("mongoose");

const favoritesSchema = new mongoose.Schema({
    _id: String,
    isFavorite: Boolean,
    searchTerm: String,
    title: String,
    url: String
})

const profilePicSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    filename: String
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
    profilePic: profilePicSchema,
    favoriteGifs: [favoritesSchema],
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
})

if (!userSchema.options.toJSON) userSchema.options.toJSON = {};
userSchema.options.toJSON.transform = function (doc, ret) {
    delete ret.password
    return ret
}

const autoPopulateFriends = function (next) {
    this.populate("friends");
    next();
}

userSchema
    .pre("findOne", autoPopulateFriends)
    .pre("findById", autoPopulateFriends)
    .pre("findOneAndUpdate", autoPopulateFriends)

module.exports = mongoose.model("User", userSchema)