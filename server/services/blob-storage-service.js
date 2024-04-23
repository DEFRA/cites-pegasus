const { BlobServiceClient } = require("@azure/storage-blob");
const { readSecret } = require('../lib/key-vault')


async function getBlobServiceClient(server) {
    if (!server.app.blobServiceClient) {
        readSecret('BLOB-STORAGE-CONNECTION-STRING')
            .then(secret => {
                server.app.blobServiceClient = BlobServiceClient.fromConnectionString(secret.value);
            })
            .catch(err => {
                console.error(err)
                throw err
            })
    }    
}

async function createContainer(server, containerName, attemptNo = 1) {

    try {
        const containerClient = server.app.blobServiceClient.getContainerClient(containerName);
        await containerClient.create();
    }
    catch (err) {
        console.log(err)
        throw err
    }

    return containerName
}

async function createContainerWithTimestamp(server, name, attemptNo = 1) {
    const containerName = `${name}-${new Date().getTime()}`;

    try {
        const containerClient = server.app.blobServiceClient.getContainerClient(containerName);
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

            return await createContainerWithTimestamp(server, name, attemptNo + 1)
        }
        throw err
    }

    return containerName
}

async function saveFileToContainer(server, containerName, filename, data) {
    try {
        const containerClient = server.app.blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(filename);
        await blockBlobClient.uploadData(data);
        return blockBlobClient.url
    }
    catch (err) {
        console.log(err)
        throw err
    }
}

async function saveObjectToContainer(server, containerName, filename, object) {
    let blockBlobClient = null
    try {

        const data = JSON.stringify(object)
        const containerClient = server.app.blobServiceClient.getContainerClient(containerName);
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

    return blockBlobClient.url
}

async function deleteFileFromContainer(server, containerName, fileName) {
    try {
        const containerClient = server.app.blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        if (await checkContainerExists(server, containerName)) {
            await blockBlobClient.deleteIfExists({ deleteSnapshots: 'include' });
        }
    }
    catch (err) {
        console.log(err)
        throw err
    }
}

async function checkFileExists(server, containerName, fileName) {
    if (await checkContainerExists(server, containerName)) {
        const containerClient = server.app.blobServiceClient.getContainerClient(containerName)
        const blockBlobClient = containerClient.getBlockBlobClient(fileName)
        return await blockBlobClient.exists()
    }
    return false
}


async function getObjectFromContainer(server, containerName, filename) {
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

function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on('data', (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on('error', reject);
    });
}

async function checkContainerExists(server, containerName) {
    const containerClient = server.app.blobServiceClient.getContainerClient(containerName)
    return await containerClient.exists()
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
    getObjectFromContainer
}