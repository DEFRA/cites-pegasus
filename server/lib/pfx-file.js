const { readFile } = require('fs')
const { resolve } = require('path')

const CERTIFICATE_ROOT = resolve(__dirname, '..', 'certificates')
const getCertificatePath = filename => resolve(CERTIFICATE_ROOT, filename)

function readCertificateFromFile(filename) {
    const certificatePath = getCertificatePath(filename)
    return new Promise((resolve, reject) => {
        readFile(certificatePath, (err, certificate) => {
            if (err){
                return reject(err)
            }
            console.log(certificate)
            resolve(certificate)
        })
    })
}

module.exports = { readCertificateFromFile }