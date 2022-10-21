module.exports.createFlashResponse = (response, statusCode, statusMsg) => {
    return response.status(statusCode).send({ flash: statusMsg })
}
