const { urlPrefix } = require("../../config/config")
const { getSubmission, validateSubmission, saveDraftSubmission } = require('./submission');
const invalidSubmissionPath = `${urlPrefix}/`

function createGetHandler(path, pathValidation, viewName, createModel) {
    const getHandler = {
        method: 'GET',
        path: path,
        options: {
            validate: {
                params: pathValidation
            }
        },
        handler: async (request, h) => {
            const { applicationIndex } = request.params
            const submission = getSubmission(request);

            try {
                validateSubmission(submission, request.path.replace(/^\/+/, ''))
            } catch (err) {
                console.error(err)
                return h.redirect(invalidSubmissionPath)
            }

            const data = {
                applicationIndex,
                submission
            }

            return h.view(viewName, createModel(data))
        }
    }
    return getHandler
}

function createPostHandler(path, pathValidation, getRedirect) {
    return {
        method: 'POST',
        path: path,
        options: {
            validate: {
                params: pathValidation
            }
        },
        handler: async (request, h) => {
            const submission = getSubmission(request);

            try {
                validateSubmission(submission, request.path.replace(/^\/+/, ''))
            } catch (err) {
                console.error(err);
                return h.redirect(invalidSubmissionPath);
            }
            const redirectTo = getRedirect(request.params)
            saveDraftSubmission(request, redirectTo)
            return h.redirect(redirectTo)
        }
    }
}

module.exports = { createGetHandler, createPostHandler }