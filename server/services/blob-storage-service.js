const { BlobServiceClient } = require("@azure/storage-blob");
const { readSecret } = require('../lib/key-vault')
let blobServiceClient = null

readSecret('BLOB-STORAGE-CONNECTION-STRING')
    .then(secret => {
        blobServiceClient = BlobServiceClient.fromConnectionString(secret.value);
    })
    .catch(err => {
        console.error(err)
        throw err
    })

async function createContainer(containerName, attemptNo = 1) {

    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.create();
    }
    catch (err) {
        console.log(err)
        throw err
    }

    return containerName
}

async function createContainerWithTimestamp(name, attemptNo = 1) {
    const containerName = `${name}-${new Date().getTime()}`;

    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.create();
    }

    catch (err) {
        console.log(containerName)
        if (err.code === 'ContainerAlreadyExists') {
            if (attemptNo >= 5) {
                console.log("Unable to find unique container name after 5 attempts")
                throw Boom.badImplementation("Unable to find unique container name after 5 attempts", err)
            }

            await new Promise(resolve => setTimeout(resolve, 100));//wait 100ms

            return await createContainerWithTimestamp(name, attemptNo + 1)
        }
        throw err
    }

    return containerName
}

async function saveFileToContainer(containerName, filename, data) {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(filename);
        await blockBlobClient.uploadData(data);
    }
    catch (err) {
        console.log(err)
        throw err
    }
    return blockBlobClient.url
}

async function saveObjectToContainer(containerName, filename, object) {
    let blockBlobClient = null
    try {

        const data = JSON.stringify(object)
        const containerClient = blobServiceClient.getContainerClient(containerName);
        blockBlobClient = containerClient.getBlockBlobClient(filename);
        await blockBlobClient.upload(data, data.length, {
            blobHTTPHeaders: {
                blobContentType: 'application/json'
            }
        })
    }
    catch (err) {
        console.log(err)
        throw err
    }
    console.log('object saved')
    return blockBlobClient.url
}

async function deleteFileFromContainer(containerName, fileName) {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        await blockBlobClient.deleteIfExists({ deleteSnapshots: 'include' });
    }
    catch (err) {
        console.log(err)
        throw err
    }
}

async function checkFileExists(containerName, fileName) {
    if(checkContainerExists(containerName)) {
        const containerClient = blobServiceClient.getContainerClient(containerName)
        const blockBlobClient = containerClient.getBlockBlobClient(fileName)
        return await blockBlobClient.exists()
    }
    return false
}

async function checkContainerExists(containerName) {
    const containerClient = blobServiceClient.getContainerClient(containerName)
    return await containerClient.exists()
}

module.exports = { createContainer, saveFileToContainer, deleteFileFromContainer, createContainerWithTimestamp, checkContainerExists, saveObjectToContainer, checkFileExists }