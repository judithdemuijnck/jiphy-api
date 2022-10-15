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

// SE: See comment in users.js line 10
// userSchema.methods.toJSON = function () {
//     // JdM: why are you using var here?
//     var obj = this.toObject();
//     delete obj.password;
//     return obj;
// }

//JdM: I couldn't get your solution to work (not sure why :( ), 
// but this solution from mongoose docs works:
// SE: answer: super! its possible my fix is outdated. If it works it works!
if (!userSchema.options.toJSON) userSchema.options.toJSON = {};
userSchema.options.toJSON.transform = function (doc, ret) {
    delete ret.password
    return ret
}

const autoPopulateFriends = function (next) {
    this.populate("friends");
    next();
}

//J dM: I was trying to autopopulate friends, but neither pre nor post is working
// Is there a way to autpopulate friends?
// SE: answer: fixed - it was because "find" actually isn't being used anywhere, only the three below are!

userSchema
    .pre("findOne", autoPopulateFriends)
    .pre("findById", autoPopulateFriends)
    .pre("findOneAndUpdate", autoPopulateFriends)

module.exports = mongoose.model("User", userSchema)