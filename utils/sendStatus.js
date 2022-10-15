module.exports.sendStatus = (response, statusCode, statusMsg) => {
    // SE: good practice: best to return this line, that way express will know this is the end of the request chain.
    response.status(statusCode).send({ flash: statusMsg })
}
