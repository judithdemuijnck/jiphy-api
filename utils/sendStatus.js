module.exports.sendStatus = (response, statusCode, statusMsg) => {
    response.status(statusCode).send({ flash: statusMsg })
}
