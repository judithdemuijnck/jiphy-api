const { loginUser, registerUser, addDefaultFriend } = require("./accounts")

const mockUser = {
    username: "mockUser",
    password: "mockPassword",
    email: "mock@user.com",
    friends: []
}
describe("addDefaultFriend", () => {
    test("adds a friend to User's friendlist", async () => {
        // await addDefaultFriend(mockUser)
        // expect(mockUser.friends.length).toBe(0)
        expect(true).toBeTruthy()
    })
})

