// SE: Absolute good practice would be to declare a logging function, even if for now that just writes to the console
// i.e logger.js
// const logger = () => ({
//   error: (error) => console.error(error)
// })

// JdM: I have to admit, I'm not actually sure how to use this

const logger = () => ({
    error: (error) => console.error(error)
})