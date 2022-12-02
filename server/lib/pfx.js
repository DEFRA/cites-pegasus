const { readFile } = require('fs')
const { resolve } = require('path')
const { CertificateClient } = require("@azure/keyvault-certificates");
const { SecretClient } = require("@azure/keyvault-secrets");
const { DefaultAzureCredential } = require("@azure/identity");

const CERTIFICATE_ROOT = resolve(__dirname, '..', 'certificates')
const getCertificatePath = filename => resolve(CERTIFICATE_ROOT, filename)

function readCertificateFromFile(filename) {
    let certificatePath = getCertificatePath(filename)
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

async function readCertificateFromAzureKeyVault(certname) {
    const url = process.env["AZURE_KEY_VAULT_URI"] || "<keyvault-url>";
    const credential = new DefaultAzureCredential();
    //const credential = new TokenCredential('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjJaUXBKM1VwYmpBWVhZR2FYRUpsOGxWMFRPSSIsImtpZCI6IjJaUXBKM1VwYmpBWVhZR2FYRUpsOGxWMFRPSSJ9.eyJhdWQiOiJodHRwczovL2RlZnJhLWFwaGEtY2l0ZXMtc2FuZGJveDAwLmFwaS5jcm0xMS5keW5hbWljcy5jb20iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC82ZjUwNDExMy02YjY0LTQzZjItYWRlOS0yNDJlMDU3ODAwMDcvIiwiaWF0IjoxNjY5OTkxNjMzLCJuYmYiOjE2Njk5OTE2MzMsImV4cCI6MTY2OTk5NTUzMywiYWlvIjoiRTJaZ1lIaC9YSjVySStlbHJYZm1DajZOWXJ6TkJ3QT0iLCJhcHBpZCI6IjFmZTZhNjI4LThkNmQtNDIwMi04Y2NiLTAyYWY0ZDFhYTk4MiIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzZmNTA0MTEzLTZiNjQtNDNmMi1hZGU5LTI0MmUwNTc4MDAwNy8iLCJvaWQiOiI0MzdiM2EyNi01MjU3LTRjOWUtYWE4Zi0yNzdiNWJiZTBkMTMiLCJyaCI6IjAuQVRvQUUwRlFiMlJyOGtPdDZTUXVCWGdBQndjQUFBQUFBQUFBd0FBQUFBQUFBQUE2QUFBLiIsInN1YiI6IjQzN2IzYTI2LTUyNTctNGM5ZS1hYThmLTI3N2I1YmJlMGQxMyIsInRpZCI6IjZmNTA0MTEzLTZiNjQtNDNmMi1hZGU5LTI0MmUwNTc4MDAwNyIsInV0aSI6InJiMWU4UV9VSFU2MEUtXzJkb0pPQUEiLCJ2ZXIiOiIxLjAifQ.U0sSyo9x9hHqAP0JkkSueN4sVQFMpEB2pNyaapYZd6qaxhDPAoAn9t4uBmIYKk_vTK26cU5VvOggBB1w6WHFKq6mBaoNGtAT3ErSgyNPGBvJFFKu_IUyilEJ7I13T5VuLVu2VtGbWWaCWfxh6YQTu5d15UdfLwo1Lwyaa1pX93mP_bEY07Dn4BiBadV4JQnDcU08lQzIEPMboUWTlF605UoAtHgNjTxi7I4yt81ieNwgCZDryFi8swyN3mdM4Y7P1n8K4I6aVZJcEtFpiTD73jNAWGLfX0A956GeKyXWJpypjI-R6UI4IERt_fbw3d3AhSmr1wEAryVKX8Hb291s7A')

    const client = new CertificateClient(url, credential);
    const certificate = await client.getCertificate(certname);
    console.log(certificate.cer)
    return certificate
}

function readSecretFromAzureKeyVault(certname) {
    const url = process.env["AZURE_KEY_VAULT_URI"] || "<keyvault-url>";
    const credential = new DefaultAzureCredential();
    //const credential = new TokenCredential('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjJaUXBKM1VwYmpBWVhZR2FYRUpsOGxWMFRPSSIsImtpZCI6IjJaUXBKM1VwYmpBWVhZR2FYRUpsOGxWMFRPSSJ9.eyJhdWQiOiJodHRwczovL2RlZnJhLWFwaGEtY2l0ZXMtc2FuZGJveDAwLmFwaS5jcm0xMS5keW5hbWljcy5jb20iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC82ZjUwNDExMy02YjY0LTQzZjItYWRlOS0yNDJlMDU3ODAwMDcvIiwiaWF0IjoxNjY5OTkxNjMzLCJuYmYiOjE2Njk5OTE2MzMsImV4cCI6MTY2OTk5NTUzMywiYWlvIjoiRTJaZ1lIaC9YSjVySStlbHJYZm1DajZOWXJ6TkJ3QT0iLCJhcHBpZCI6IjFmZTZhNjI4LThkNmQtNDIwMi04Y2NiLTAyYWY0ZDFhYTk4MiIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzZmNTA0MTEzLTZiNjQtNDNmMi1hZGU5LTI0MmUwNTc4MDAwNy8iLCJvaWQiOiI0MzdiM2EyNi01MjU3LTRjOWUtYWE4Zi0yNzdiNWJiZTBkMTMiLCJyaCI6IjAuQVRvQUUwRlFiMlJyOGtPdDZTUXVCWGdBQndjQUFBQUFBQUFBd0FBQUFBQUFBQUE2QUFBLiIsInN1YiI6IjQzN2IzYTI2LTUyNTctNGM5ZS1hYThmLTI3N2I1YmJlMGQxMyIsInRpZCI6IjZmNTA0MTEzLTZiNjQtNDNmMi1hZGU5LTI0MmUwNTc4MDAwNyIsInV0aSI6InJiMWU4UV9VSFU2MEUtXzJkb0pPQUEiLCJ2ZXIiOiIxLjAifQ.U0sSyo9x9hHqAP0JkkSueN4sVQFMpEB2pNyaapYZd6qaxhDPAoAn9t4uBmIYKk_vTK26cU5VvOggBB1w6WHFKq6mBaoNGtAT3ErSgyNPGBvJFFKu_IUyilEJ7I13T5VuLVu2VtGbWWaCWfxh6YQTu5d15UdfLwo1Lwyaa1pX93mP_bEY07Dn4BiBadV4JQnDcU08lQzIEPMboUWTlF605UoAtHgNjTxi7I4yt81ieNwgCZDryFi8swyN3mdM4Y7P1n8K4I6aVZJcEtFpiTD73jNAWGLfX0A956GeKyXWJpypjI-R6UI4IERt_fbw3d3AhSmr1wEAryVKX8Hb291s7A')

    const client = new SecretClient(url, credential);
    return client.getSecret(certname);
}

async function readCertificateVersionFromAzureKeyVault(certname) {
    const url = process.env["AZURE_KEY_VAULT_URI"] || "<keyvault-url>";
    const credential = new DefaultAzureCredential();
    //const credential = new TokenCredential('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjJaUXBKM1VwYmpBWVhZR2FYRUpsOGxWMFRPSSIsImtpZCI6IjJaUXBKM1VwYmpBWVhZR2FYRUpsOGxWMFRPSSJ9.eyJhdWQiOiJodHRwczovL2RlZnJhLWFwaGEtY2l0ZXMtc2FuZGJveDAwLmFwaS5jcm0xMS5keW5hbWljcy5jb20iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC82ZjUwNDExMy02YjY0LTQzZjItYWRlOS0yNDJlMDU3ODAwMDcvIiwiaWF0IjoxNjY5OTkxNjMzLCJuYmYiOjE2Njk5OTE2MzMsImV4cCI6MTY2OTk5NTUzMywiYWlvIjoiRTJaZ1lIaC9YSjVySStlbHJYZm1DajZOWXJ6TkJ3QT0iLCJhcHBpZCI6IjFmZTZhNjI4LThkNmQtNDIwMi04Y2NiLTAyYWY0ZDFhYTk4MiIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzZmNTA0MTEzLTZiNjQtNDNmMi1hZGU5LTI0MmUwNTc4MDAwNy8iLCJvaWQiOiI0MzdiM2EyNi01MjU3LTRjOWUtYWE4Zi0yNzdiNWJiZTBkMTMiLCJyaCI6IjAuQVRvQUUwRlFiMlJyOGtPdDZTUXVCWGdBQndjQUFBQUFBQUFBd0FBQUFBQUFBQUE2QUFBLiIsInN1YiI6IjQzN2IzYTI2LTUyNTctNGM5ZS1hYThmLTI3N2I1YmJlMGQxMyIsInRpZCI6IjZmNTA0MTEzLTZiNjQtNDNmMi1hZGU5LTI0MmUwNTc4MDAwNyIsInV0aSI6InJiMWU4UV9VSFU2MEUtXzJkb0pPQUEiLCJ2ZXIiOiIxLjAifQ.U0sSyo9x9hHqAP0JkkSueN4sVQFMpEB2pNyaapYZd6qaxhDPAoAn9t4uBmIYKk_vTK26cU5VvOggBB1w6WHFKq6mBaoNGtAT3ErSgyNPGBvJFFKu_IUyilEJ7I13T5VuLVu2VtGbWWaCWfxh6YQTu5d15UdfLwo1Lwyaa1pX93mP_bEY07Dn4BiBadV4JQnDcU08lQzIEPMboUWTlF605UoAtHgNjTxi7I4yt81ieNwgCZDryFi8swyN3mdM4Y7P1n8K4I6aVZJcEtFpiTD73jNAWGLfX0A956GeKyXWJpypjI-R6UI4IERt_fbw3d3AhSmr1wEAryVKX8Hb291s7A')

    const client = new CertificateClient(url, credential);
    const latestCertificate = await client.getCertificate(certname);
    return client.getCertificateVersion(certname, latestCertificate.properties.version);
}

function readPfx(certname, passphrase) {
    return readCertificateFromFile(certname + '.pfx').then(pfx => ({ pfx, passphrase }))
    //return readCertificateFromAzureKeyVault(certname).then(pfx => ({ pfx, passphrase }))
}

module.exports = { readPfx, readCertificateFromAzureKeyVault, readSecretFromAzureKeyVault, readCertificateVersionFromAzureKeyVault }