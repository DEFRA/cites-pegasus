const Joi = require('joi')
const urlPrefix = require('../../config/config').urlPrefix
const { findErrorList, getFieldError } = require('../lib/helper-functions')
const { getSubmission, mergeSubmission, setSubmission } = require('../lib/submission')
const { BlobServiceClient } = require("@azure/storage-blob");
const textContent = require('../content/text-content')
const pageId = 'upload-supporting-documents'
const currentPath = `${urlPrefix}/${pageId}`
const previousPath = `${urlPrefix}/your-applications`
const nextPath = `${urlPrefix}/declaration`
const invalidSubmissionPath = urlPrefix
const Boom = require('@hapi/boom');

const connStr = "DefaultEndpointsProtocol=https;AccountName=bscitesapplicatidev;AccountKey=KdvFlnb5arDIqS7mUpCS2KGTYQMJvDKWMWXetNb1hNe56ZRp5RjPAOfSDZfiavDIUcYAim3I9b3G+AStSqSZsw==;EndpointSuffix=core.windows.net";
const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);


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
    const fields = ["fileUpload", "fileUpload.hapi.headers.content-type", "fileUpload.hapi.filename"]
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

  const model = {
    backLink: `${previousPath}`,
    formActionPage: `${currentPath}`,
    ...(errorList ? { errorList } : {}),
    supportingDocuments: supportingDocuments,
    pageTitle: errorList && errorList?.length !== 0 ? commonContent.errorSummaryTitlePrefix + errorList[0].text : pageContent.defaultTitle,

    inputFile: {
      id: "fileUpload",
      name: "fileUpload",
      errorMessage: getFieldError(errorList, '#fileUpload'),
      attributes: {
        //multiple: true,
        accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg'
      }
    }
  }
  return { ...commonContent, ...model }
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
    supportingDocuments: submission.supportingDocuments
  }

  return h.view(pageId, createModel(err, pageData)).takeover()
}

async function createBlobContainer(attemptNo = 1) {
  const containerName = `cites-submission-${new Date().getTime()}`;

  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.create();
  }

  catch (err) {
    console.log(`cites-submission-${new Date().getTime()}`)
    if (err.code === 'ContainerAlreadyExists') {
      if (attemptNo >= 5) {
        console.log("Unable to find unique container name after 5 attempts")
        throw Boom.badImplementation("Unable to find unique container name after 5 attempts", err)
      }

      await new Promise(resolve => setTimeout(resolve, 100));//wait 100ms

      return await createBlobContainer(attemptNo + 1)
    }
    throw err
  }

  return containerName
}

async function addFileToBlobContainer(containerName, fileUpload) {
  const fileName = fileUpload.hapi.filename
  const fileData = fileUpload._data
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  const url = blockBlobClient.url;
  await blockBlobClient.uploadData(fileData);

  return url
  //const submission = getSubmission(request)
  // const supportingDocuments = submission.supportingDocuments || { files: [] } 
  // supportingDocuments.files.push({ fileName, containerName })
  // setSubmission(request, { ...submission, supportingDocuments })
}

module.exports = [
  {
    method: "GET",
    path: `${currentPath}`,
    handler: async (request, h) => {
      const submission = getSubmission(request)

    //Check that the container is still in azure
      if (submission.supportingDocuments?.containerName) {
        const containerClient = blobServiceClient.getContainerClient(submission.supportingDocuments.containerName);

        const exists = await containerClient.exists();

        if (!exists) {
          submission.supportingDocuments = { files: [] }
          try {
            setSubmission(request, submission)
          } catch (err) {
            console.error(err);
            return h.redirect(`${invalidSubmissionPath}/`)
          }
        }

      }

      // try {
      //   validateSubmission(submission, `${pageId}/${request.params.applicationIndex}`)
      // } catch (err) {
      //   console.log(err)
      //   return h.redirect(`${invalidSubmissionPath}/`)
      // }

      const pageData = { files: submission.supportingDocuments?.files || [] }

      return h.view(pageId, createModel(null, pageData))

    }
  },
  {
    method: "POST",
    path: `${currentPath}/upload`,
    options: {
      payload: {
        maxBytes: 10485760, // 10 MB limit
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
        timeout: false
      },
      // validate: {
      //   // payload: Joi.object({
      //   //   fileUpload: Joi.array().items(Joi.object({
      //   //     hapi: Joi.object({
      //   //       filename: Joi.string().required(),
      //   //       headers: Joi.object({
      //   //         'content-disposition': Joi.string().required(),
      //   //         'content-type': Joi.string().valid('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg').required()
      //   //       }).unknown(true),
      //   //     }).unknown(true),
      //   //     _data: Joi.any().required()
      //   //   }).unknown(true)).required().min(1).max(5),
      //   // }).unknown(true).required(),
      //   failAction: failAction
      handler: async (request, h) => {
        if (request.headers["content-length"] > 10485760) {
          return h.response('File size is too large').code(413)
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

        // const files = []
        // if (Array.isArray(value.fileUpload)) {
        //   value.fileUpload.forEach(file => {
        //     files.push(file)
        //   })
        // } else {
        //   files.push(value.fileUpload)
        // }

        // console.log(files)

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

        if (!docs.containerName) {
          const containerName = await createBlobContainer()
          docs.containerName = containerName
          try {
            mergeSubmission(request, { supportingDocuments: docs }, `${pageId}`)
          } catch (err) {
            console.error(err);
            return h.redirect(`${invalidSubmissionPath}/`)
          }
        }

        try {
          const blobUrl = await addFileToBlobContainer(docs.containerName, request.payload.fileUpload)
          docs.files.push({ fileName: request.payload.fileUpload.hapi.filename, blobUrl: blobUrl })
          try {
            mergeSubmission(request, { supportingDocuments: docs }, `${pageId}`)
          } catch (err) {
            console.error(err);
            return h.redirect(`${invalidSubmissionPath}/`)
          }
        }
        catch (err) {
          console.log(err)
          throw err
        }

        const pageData = { files: docs.files }
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

        const existingFile = submission.supportingDocuments.files.find(file => file.fileName === request.params.fileName)

        if (!existingFile) {
          throw new Error('File does not exist')
        }

        submission.supportingDocuments.files.splice(submission.supportingDocuments.files.indexOf(existingFile), 1)

        setSubmission(request, submission, `${pageId}`)

        const pageData = { files: submission.supportingDocuments.files }
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
        return h.redirect(nextPath)
      }
    }
  },
]
