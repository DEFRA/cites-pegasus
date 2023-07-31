const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, setSubmission, saveDraftSubmission } = require('../lib/submission')
const config = require('../../config/config')
const { createContainerWithTimestamp, saveFileToContainer, deleteFileFromContainer, checkContainerExists } = require("../services/blob-storage-service");
const textContent = require('../content/text-content')
const pageId = 'upload-supporting-documents'
const currentPath = `${urlPrefix}/${pageId}`
const assetPath = `${urlPrefix}/assets`
const previousPath = `${urlPrefix}/add-application`
const nextPath = `${urlPrefix}/declaration`
const invalidSubmissionPath = `${urlPrefix}/`
const Boom = require('@hapi/boom');
const maxFileSizeBytes = 10485760

function createModel(errors, data) {

  const commonContent = textContent.common
  const pageContent = textContent.uploadSupportingDocuments

  let errorList = null
  if (errors) {
    errorList = []
    const mergedErrorMessages = {
      ...commonContent.errorMessages,
      ...pageContent.errorMessages
    }
    const fields = ["fileUpload", "fileUpload.hapi.headers.content-type", "fileUpload.hapi.filename", "file"]
    fields.forEach((field) => {
      const fieldError = findErrorList(errors, [field], mergedErrorMessages)[0]

      if (fieldError) {
        errorList.push({
          text: fieldError,
          href: `#${field.split('.')[0]}`
        })
      }
    })
  }

  const supportingDocuments = data.files?.map((file) => {
    return {
      ...file,
      formActionDelete: `${currentPath}/delete/${encodeURIComponent(file.fileName)}`
    }
  })

  clientJSConfig = {
    fileSizeErrorText: pageContent.errorMessages["error.fileUpload.any.filesize"],
    maxFileSizeBytes: maxFileSizeBytes,
    errorSummaryTitle: commonContent.errorSummaryTitle
  }

  const model = {
    assetPath: assetPath,
    clientJSConfig: JSON.stringify(clientJSConfig),
    containerClasses: 'hide-when-loading',
    backLink: previousPath,
    formActionPage: `${currentPath}`,
    ...(errorList ? { errorList } : {}),
    supportingDocuments: supportingDocuments,
    pageTitle: errorList && errorList?.length !== 0 ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,
    isAgent: data.isAgent,
    inputFile: {
      id: "fileUpload",
      name: "fileUpload",
      errorMessage: getFieldError(errorList, '#fileUpload'),
      attributes: {
        accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg'
      }
    }
  }
  return { ...commonContent, ...pageContent, ...model }
}

const fileSchema = Joi.object({
  hapi: Joi.object({
    filename: Joi.string().required(),
    headers: Joi.object({
      'content-disposition': Joi.string().required(),
      'content-type': Joi.string().valid('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg').required()
    }).unknown(true),
  }).unknown(true),
  _data: Joi.any().required()
}).unknown(true)

function failAction(request, h, err) {
  const submission = getSubmission(request)

  const pageData = {
    isAgent: submission.isAgent,
    files: submission.supportingDocuments?.files || []
  }

  return h.view(pageId, createModel(err, pageData)).takeover()
}

module.exports = [
  {
    method: "GET",
    path: `${currentPath}`,
    handler: async (request, h) => {
      const submission = getSubmission(request)

      //Check that the container is still in azure
      if (submission.supportingDocuments?.containerName) {
        const exists = await checkContainerExists(submission.supportingDocuments.containerName)
        if (!exists) {
          submission.supportingDocuments = { files: [] }
          try {
            setSubmission(request, submission)
          } catch (err) {
            console.error(err);
            return h.redirect(invalidSubmissionPath)
          }
        }

      }

      const pageData = {
        isAgent: submission.isAgent,
        files: submission.supportingDocuments?.files || []
      }

      return h.view(pageId, createModel(null, pageData))
    }
  },
  {
    method: "POST",
    path: `${currentPath}/upload`,
    options: {
      payload: {
        maxBytes: 20971520, // 20 MB limit
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
        timeout: false
      },
      handler: async (request, h) => {
        if (request.headers["content-length"] > maxFileSizeBytes) {
          const error = {
            details: [
              {
                type: 'any.filesize',
                context: { label: 'fileUpload', key: 'fileUpload' }
              }
            ]
          }
          return failAction(request, h, error)          
        }

        let payloadSchema = null
        if (Array.isArray(request.payload.fileUpload)) {
          payloadSchema = Joi.object({ fileUpload: Joi.array().items(fileSchema) })
        } else {
          payloadSchema = Joi.object({ fileUpload: fileSchema })
        }

        const { error, value } = payloadSchema.validate(request.payload, { label: 'fileUpload' });

        // If there was an error, return a 400 Bad Request response
        if (error) {
          return failAction(request, h, error)
        }

        const submission = getSubmission(request)

        if (submission.supportingDocuments === undefined) {
          submission.supportingDocuments = { files: [] }
        }

        const docs = submission.supportingDocuments

        if (docs.files.length >= 10) {
          throw new Error('Maximum number of supporting documents reached')
        }


        const existingFile = docs.files.find(file => file.fileName === request.payload.fileUpload.hapi.filename)
        if (existingFile) {
          const error = {
            details: [
              {
                message: 'A file with this name already exists',
                path: ['fileUpload'],
                type: 'any.custom',
                context: { label: 'fileUpload', key: 'fileUpload' }
              }
            ]
          }
          return failAction(request, h, error)
        }

        try {
          if (!docs.containerName) {
            const containerName = await createContainerWithTimestamp('cites-submission')
            console.log(`Blob container created with name ${containerName}`)
            docs.containerName = containerName
            try {
              mergeSubmission(request, { supportingDocuments: docs }, `${pageId}`)
            } catch (err) {
              console.error(err);
              return h.redirect(invalidSubmissionPath)
            }
          }

          const blobUrl = await saveFileToContainer(docs.containerName, request.payload.fileUpload.hapi.filename, request.payload.fileUpload._data)
          console.log(`File added to blob container with url ${blobUrl}`)
          docs.files.push({ fileName: request.payload.fileUpload.hapi.filename, blobUrl: blobUrl })

          try {
            mergeSubmission(request, { supportingDocuments: docs }, `${pageId}`)
            saveDraftSubmission(request, currentPath)
          } catch (err) {
            console.error(err);
            return h.redirect(invalidSubmissionPath)
          }
        }
        catch (err) {
          console.error(err)
          const error = {
            details: [
              {
                type: 'upload.exception',
                context: { label: 'fileUpload', key: 'fileUpload' }
              }
            ]
          }

          return failAction(request, h, error)
        }

        const pageData = {
          isAgent: submission.isAgent,
          files: docs.files
        }

        return h.view(pageId, createModel(null, pageData)).takeover()
      }
    }
  },
  {
    method: "POST",
    path: `${currentPath}/delete/{fileName}`,
    options: {
      payload: {
        allow: 'multipart/form-data',
        multipart: true
      },
      handler: async (request, h) => {

        const submission = getSubmission(request)

        if (submission.supportingDocuments === undefined) {
          submission.supportingDocuments = { files: [] }
        }

        const docs = submission.supportingDocuments

        const existingFile = docs.files.find(file => file.fileName === request.params.fileName)

        if (!existingFile) {
          throw new Error('File does not exist')
        }

        try {
          await deleteFileFromContainer(docs.containerName, existingFile.fileName)
          docs.files.splice(docs.files.indexOf(existingFile), 1)

          try {
            setSubmission(request, submission, `${pageId}`)
          } catch (err) {
            console.error(err);
            return h.redirect(invalidSubmissionPath)
          }
          saveDraftSubmission(request, currentPath)
        }
        catch (err) {
          console.error(err)
          const error = {
            details: [
              {
                type: 'delete.exception',
                context: { label: 'file', key: 'file' }
              }
            ]
          }

          return failAction(request, h, error)
        }

        const pageData = {
          isAgent: submission.isAgent,
          files: docs.files
        }

        return h.view(pageId, createModel(null, pageData)).takeover()
      }
    }
  },
  {
    method: "POST",
    path: `${currentPath}/continue`,
    options: {
      payload: {
        allow: 'multipart/form-data',
        multipart: true
      },
      handler: async (request, h) => {
        const submission = getSubmission(request)

        if (submission.supportingDocuments && !submission.supportingDocuments?.files?.length) {
          delete submission.supportingDocuments

          try {
            setSubmission(request, submission, `${pageId}`)
          } catch (err) {
            console.error(err);
            return h.redirect(invalidSubmissionPath)
          }
        }
        return h.redirect(nextPath)
      }
    }
  },
]
