const { BlobServiceClient } = require("@azure/storage-blob");
const config = require('../../config/config')

const { DefaultAzureCredential } = require("@azure/identity")

const AVScanResult = {
    SUCCESS: 'success',
    MALICIOUS: 'malicious',
    TIMEOUT: 'timeout',
    UNKNOWN: 'unknown',
    PROCESSING: 'processing'
}

async function getBlobServiceClient(server) {
    // Use 'az login' command from the azure-cli npm package to identify
    // Azure SDK clients accept the credential as a parameter
    const credential = new DefaultAzureCredential();
    if (!server.app.blobServiceClient) {
        server.app.blobServiceClient = new BlobServiceClient(config.storageAccountUrl, credential);
    }
}

async function createContainer(server, containerName) {

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
                console.error("Unable to find unique container name after 5 attempts")
                throw new Error("Unable to find unique container name after 5 attempts", err)
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
        const avScanResult = await getAVScanStatus(blockBlobClient)
        let url = blockBlobClient.url

        if (avScanResult !== AVScanResult.SUCCESS) {
            deleteFileFromContainer(server, containerName, filename).then(() => {
                console.log(`File ${filename} deleted from storage account because of AV scan result: ${avScanResult}`)
            })
            .catch(() => {
                //Do nothing
            })

            url = null
        }

        return {
            url,
            avScanResult
        }
    }
    catch (err) {
        console.log(err)
        throw err
    }
}

let scanCheckIntervalId
let timeoutId

async function getAVScanStatus(blockBlobClient) {
    return new Promise((resolve, reject) => {

        async function checkScan() {
            console.log(`Check if AV scan is complete`)
            try {
                const scanResult = await getAVScanResult(blockBlobClient)
                if (scanResult !== AVScanResult.PROCESSING) {
                    clearInterval(scanCheckIntervalId)
                    clearTimeout(timeoutId)
                    resolve(scanResult)
                }
            } catch (err) {
                clearInterval(scanCheckIntervalId)
                clearTimeout(timeoutId)
                reject(new Error(err.message))
            }
        }

        // Run the scan check immediately
        checkScan()

        scanCheckIntervalId = setInterval(checkScan, config.antiVirusCheckInterval)

        timeoutId = setTimeout(() => {
            clearInterval(scanCheckIntervalId);
            resolve(AVScanResult.TIMEOUT)
        }, config.antiVirusTimeout)
    })
}

async function getAVScanResult(blockBlobClient) {
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
    }
    catch (err) {
        console.error("Unable to read document tags")
        console.error(err)
        throw err
    }
    return AVScanResult.PROCESSING
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
        const exists = await blockBlobClient.exists()
        return exists
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

async function listContainerNames(server, maxPageSize) {
    const options = {
        includeDeleted: false,
        includeMetadata: true,
        includeSystem: true
        //prefix: containerNamePrefix
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