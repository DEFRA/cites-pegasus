const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('../../config/config')

const { DefaultAzureCredential } = require('@azure/identity')

const AVScanResult = {
  SUCCESS: 'success',
  MALICIOUS: 'malicious',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown',
  PROCESSING: 'processing'
}

async function getBlobServiceClient (server) {
  // Use 'az login' command from the azure-cli npm package to identify
  // Azure SDK clients accept the credential as a parameter
  const credential = new DefaultAzureCredential()
  if (!server.app.blobServiceClient) {
    server.app.blobServiceClient = new BlobServiceClient(config.storageAccountUrl, credential)
  }
}

async function createContainer (server, containerName) {
  try {
    const containerClient = server.app.blobServiceClient.getContainerClient(containerName)
    await containerClient.create()
  } catch (err) {
    console.log(err)
    throw err
  }

  return containerName
}

async function createContainerWithTimestamp (server, name, attemptNo = 1) {
  const containerName = `${name}-${new Date().getTime()}`

  try {
    const containerClient = server.app.blobServiceClient.getContainerClient(containerName)
    await containerClient.create()
  } catch (err) {
    console.log(containerName)
    const maxAttempts = 5
    if (err.code === 'ContainerAlreadyExists') {
      if (attemptNo >= maxAttempts) {
        console.error(`Unable to find unique container name after ${maxAttempts} attempts`)
        throw new Error(`Unable to find unique container name after ${maxAttempts} attempts`, err)
      }

      await new Promise(resolve => setTimeout(resolve, 100))// wait 100ms

      return createContainerWithTimestamp(server, name, attemptNo + 1)
    }
    throw err
  }

  return containerName
}

async function saveFileToContainer (server, containerName, filename, data) {
  try {
    const containerClient = server.app.blobServiceClient.getContainerClient(containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(filename)
    console.log(`Upload Starting for file ${filename} in container ${containerName}`)
    await blockBlobClient.uploadData(data)
    console.log(`Upload Completed for file ${filename} in container ${containerName}`)
    console.log(`Polling for AV scan result starting for file ${filename} in container ${containerName}`)
    const avScanResult = await pollForAVScanStatus(blockBlobClient)
    console.log(`Polling for AV scan result completed with result '${avScanResult}' for file ${filename} in container ${containerName}`)
    let url = blockBlobClient.url

    if (avScanResult !== AVScanResult.SUCCESS) {
      deleteFileFromContainer(server, containerName, filename).then(() => {
        console.log(`File ${filename} deleted from storage account because of AV scan result: ${avScanResult}`)
      })
        .catch(() => {
          // Do nothing
        })

      url = null
    }

    return {
      url,
      avScanResult
    }
  } catch (err) {
    console.log(err)
    throw err
  }
}

async function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function pollForAVScanStatus (blockBlobClient) {
  const startTime = Date.now()
  let awaitingScanResult = true

  while (awaitingScanResult) {
    console.log(`Check if AV scan is complete for file ${blockBlobClient._name} in container ${blockBlobClient.url}`)
    const scanResult = await getAVScanResult(blockBlobClient)
    if (scanResult !== AVScanResult.PROCESSING) {
      return scanResult
    }

    if (Date.now() - startTime > config.antiVirusTimeout) {
      console.log('AV scan status polling timed out.')
      awaitingScanResult = false
    } else {
      await delay(config.antiVirusCheckInterval)
    }
  }

  return AVScanResult.TIMEOUT
}

async function getAVScanResult (blockBlobClient) {
  try {
    const tagsResponse = await blockBlobClient.getTags()
    if (tagsResponse.tags?.['Malware Scanning scan result']) {
      const scanResult = tagsResponse.tags['Malware Scanning scan result']

      switch (scanResult.toUpperCase()) {
        case 'NO THREATS FOUND':
          return AVScanResult.SUCCESS
        case 'MALICIOUS':
          return AVScanResult.MALICIOUS
        default:
          console.error('AV scan complete with unknown response')
          return AVScanResult.UNKNOWN
      }
    }
  } catch (err) {
    console.error('Unable to read document tags')
    console.error(err)
    throw err
  }
  return AVScanResult.PROCESSING
}

async function saveObjectToContainer (server, containerName, filename, object) {
  let blockBlobClient = null
  try {
    const data = JSON.stringify(object)
    const containerClient = server.app.blobServiceClient.getContainerClient(containerName)
    blockBlobClient = containerClient.getBlockBlobClient(filename)
    await blockBlobClient.upload(data, data.length, {
      blobHTTPHeaders: {
        blobContentType: 'application/json'
      }
    })
  } catch (err) {
    console.log(err)
    throw err
  }

  return blockBlobClient.url
}

async function deleteFileFromContainer (server, containerName, fileName) {
  try {
    const containerClient = server.app.blobServiceClient.getContainerClient(containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(fileName)
    if (await checkContainerExists(server, containerName)) {
      await blockBlobClient.deleteIfExists({ deleteSnapshots: 'include' })
    }
  } catch (err) {
    console.log(err)
    throw err
  }
}

async function checkFileExists (server, containerName, fileName) {
  if (await checkContainerExists(server, containerName)) {
    const containerClient = server.app.blobServiceClient.getContainerClient(containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(fileName)
    const exists = await blockBlobClient.exists()
    return exists
  }
  return false
}

async function getObjectFromContainer (server, containerName, filename) {
  if (!await checkContainerExists(server, containerName)) {
    const err = 'Container does not exist'
    console.log(err)
    throw err
  }
  try {
    const containerClient = server.app.blobServiceClient.getContainerClient(containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(filename)
    const downloadResponse = await blockBlobClient.download(0)
    const downloadedData = await streamToBuffer(downloadResponse.readableStreamBody)
    const object = JSON.parse(downloadedData.toString('utf-8'))
    return object
  } catch (err) {
    console.log(err)
    throw err
  }
}

function streamToBuffer (readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data))
    })
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
    readableStream.on('error', reject)
  })
}

async function checkContainerExists (server, containerName) {
  const containerClient = server.app.blobServiceClient.getContainerClient(containerName)
  return containerClient.exists()
}

async function listContainerNames (server, maxPageSize) {
  const options = {
    includeDeleted: false,
    includeMetadata: true,
    includeSystem: true
    // prefix: containerNamePrefix
  }
  const iterator = server.app.blobServiceClient.listContainers(options).byPage({ maxPageSize })
  const response = (await iterator.next()).value
  if (response.containerItems) {
    return response.containerItems.map(container => container.name)
  }
  return []
}

module.exports = {
  getBlobServiceClient,
  createContainer,
  saveFileToContainer,
  deleteFileFromContainer,
  createContainerWithTimestamp,
  checkContainerExists,
  saveObjectToContainer,
  checkFileExists,
  getObjectFromContainer,
  listContainerNames,
  AVScanResult
}
