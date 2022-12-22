const { searchGifs, seeFavoriteGifs, toggleFavoriteGif, removeFromFavorites, addToFavorites, isAlreadyInFavorites } = require("./gifs")
const axios = require("axios")
jest.mock("axios")

Array.prototype.pull = (item, arr = mockUser.favoriteGifs) => {
    const idx = arr.findIndex(el => el._id === item._id)
    arr.splice(idx, 1)
}

// easier with OOP???

const mockGifResponse = {
    data: {
        data: [
            {
                id: 1,
                title: "Fake title 1",
                images: { original: { url: "https://media4.giphy.com/media/dvBgr7pA6FTJOMOALY/giphy.gif" } }
            },
            {
                id: 2,
                title: "Fake title 2",
                images: { original: { url: "https://media3.giphy.com/media/fTne319LfO6Noh80qD/giphy.gif" } }
            }
        ]
    }
}

const mockGifData = mockGifResponse?.data?.data?.map(gif => {
    return {
        _id: gif.id,
        searchTerm: "fox",
        title: gif.title,
        url: gif.images.original.url
    }
})

const mockUser = {
    username: "fakeUser",
    password: "fakePassword",
    email: "fake@user.com",
    favoriteGifs: [
        { ...mockGifData[0], isFavorite: true },
    ],
    save: () => {
        console.log("mock save to db")
    },
    toJSON: () => {
        delete mockUser.password
        return mockUser
    }

}

const mockResponse = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnThis();
    res.send = jest.fn().mockReturnThis();
    res.locals = { matchedUser: mockUser, loggedInUser: mockUser }
    return res
}

const mockRequest = (testData) => {
    return { ...testData }
}

describe("searchGifs", () => {
    test("returns an object including _id, searchTerm, title and url when being passed a searchTerm", async () => {
        const req = mockRequest({ query: { searchTerm: "fox", offset: 0 } })
        const res = mockResponse()
        axios.get.mockResolvedValue(mockGifResponse)
        await searchGifs(req, res)
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.send).toHaveBeenCalledWith(mockGifData)
    })
    test("sends status 500 if query is empty", async () => {
        const req = mockRequest()
        const res = mockResponse()
        await searchGifs(req, res)
        expect(res.status).toHaveBeenCalledWith(500)
    })
    test("sends status 500 if giphy api sends error", async () => {
        const req = mockRequest({ query: { searchTerm: "", offset: 0 } })
        const res = mockResponse()
        axios.get.mockRejectedValueOnce()
        await searchGifs(req, res)
        expect(res.status).toHaveBeenCalledWith(500)
    })
})

describe("seeFavoriteGifs", () => {
    test("returns an array of all of mockUser's favoriteGifs", () => {
        const req = mockRequest()
        const res = mockResponse()
        seeFavoriteGifs(req, res)
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.send).toHaveBeenCalledWith({ favorites: mockUser.favoriteGifs })
    })
    test("sends status 500 if matchedUser is undefined", () => {
        const req = mockRequest()
        const res = mockResponse()
        res.locals.matchedUser = undefined
        seeFavoriteGifs(req, res)
        expect(res.status).toHaveBeenCalledWith(500)
    })
})

describe("toggleFavoriteGif", () => {
    test("removes an existing gif object from favoriteGifs", async () => {
        const req = mockRequest({ body: { favoriteGif: { ...mockGifData[0], isFavorite: true } } })
        const res = mockResponse()
        await toggleFavoriteGif(req, res)
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.send).toHaveBeenCalledWith({ user: { ...mockUser } })
    })
    test("adds a new gif object to favoriteGifs", async () => {
        const req = mockRequest({ body: { favoriteGif: { ...mockGifData[1], isFavorite: true } } })
        const res = mockResponse()
        await toggleFavoriteGif(req, res)
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.send).toHaveBeenCalledWith({ user: { ...mockUser } })
    })
    test("returns 500 if body is emty", async () => {
        const req = mockRequest()
        const res = mockResponse()
        await toggleFavoriteGif(req, res)
        expect(res.status).toHaveBeenCalledWith(500)
    })
    test("returns 404 if User is not logged in", async () => {
        const req = mockRequest({ body: { favoriteGif: { ...mockGifData[0] } } })
        const res = mockResponse()
        res.locals.loggedInUser = undefined
        await toggleFavoriteGif(req, res)
        expect(res.status).toHaveBeenCalledWith(404)
    })

    describe("removeFromFavorites", () => {
        test("removes a gif from mockUser.favoriteGifs", () => {
            expect(mockUser.favoriteGifs.length).toBe(1)
            removeFromFavorites(mockUser, mockGifData[1])
            expect(mockUser.favoriteGifs.length).toBe(0)
        })
    })
    describe("addToFavorites", () => {
        test("adds a gif to mockUser.favoriteGifs", () => {
            expect(mockUser.favoriteGifs.length).toBe(0)
            addToFavorites(mockUser, mockGifData[0])
            expect(mockUser.favoriteGifs.length).toBe(1)
        })
    })
    describe("isAlreadyInFavorites", () => {
        test("returns true if gif is in mockUser.favoriteGifs", () => {
            const alreadyInFavorites = isAlreadyInFavorites(mockUser, mockGifData[0])
            expect(alreadyInFavorites).toBeTruthy()
        })
        test("returns false if gif is not in mockUser.favoriteGifs", () => {
            const alreadyInFavorites = isAlreadyInFavorites(mockUser, mockGifData[1])
            expect(alreadyInFavorites).toBeFalsy()
        })
    })
})

// how can I throw an error to check if error handling works?

// how to reset mockUser after each test (beforeEach, afterEach?)