// SE: Absolute good practice would be to declare a logging function, even if for now that just writes to the console
// i.e logger.js
// const logger = () => ({
//   error: (error) => console.error(error)
// })

// JdM: I have to admit, I'm not actually sure how to use this
// SE: answer: so now instead of calling console.log you can now do: 
// const logger = require('../utils/logger')
// logger.error(error)

// This means you only need to define your logging function in one place
// We call this a 'single source of truth', and is an important part of 'dont repeat yourself' (DRY) principles

const logger = () => ({
    error: (error) => console.error(error)
})

// SE: addition: adding export
module.exports = logger();
