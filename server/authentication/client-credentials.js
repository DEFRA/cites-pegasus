
const MSAL = require('@azure/msal-node');
//const fetch = require('node-fetch');

function test2() {
    const authorityUrl = 'https://login.microsoftonline.com/88167347-a6aa-44c6-adaa-fd6fb533c062';
    const msalConfig = {
        auth: {
            authority: authorityUrl,
            clientId: "aab2db52-824d-474b-b5de-5c9f28cd5137",
            clientSecret: "BiY8Q~MTkN73kykew~LcLDDdYSNKANxlyExkZcmq",
            knownAuthorities: ['login.microsoftonline.com']
        }
    }
    const cca = new MSAL.ConfidentialClientApplication(msalConfig);
    const serverUrl = 'https://org23e87736.api.crm11.dynamics.com/';
    //function that acquires a token and passes it to DynamicsWebApi
    cca.acquireTokenByClientCredential({
        scopes: [`${serverUrl}/.default`],
    }).then(response => {
        var bearer = "Bearer " + response.accessToken;
        //headers.append("Authorization", bearer);
        console.log(bearer);
        console.log(response.expiresOn)
    })
}

/*
* Copyright (c) Microsoft Corporation. All rights reserved.
* Licensed under the MIT License.
*/

var msal = require('@azure/msal-node');

/**
 * Command line arguments can be used to configure:
 * - The port the application runs on
 * - The cache file location
 * - The authentication scenario/configuration file name
 */
//const argv = require("../cliArgs");

//const cacheLocation = argv.c || "./data/cache.json";
//const cachePlugin = require('../cachePlugin')(cacheLocation);

/**
 * The scenario string is the name of a .json file which contains the MSAL client configuration
 * For an example of what a configuration file should look like, check out the customConfig.json file in the
 * /config directory.
 * 
 * You can create your own configuration file and replace the path inside the "config" require statement below
 * with the path to your custom configuraiton.
 */
//const runtimeOptions = argv.ro || null;
//const config = require(`./config/AAD.json`);

function getClientCredentialsToken(cca, clientCredentialRequestScopes, ro) {
    // With client credentials flows permissions need to be granted in the portal by a tenant administrator. 
    // The scope is always in the format "<resource>/.default"
    const clientCredentialRequest = {
        scopes: clientCredentialRequestScopes,
        azureRegion: ro ? ro.region : null, // (optional) specify the region you will deploy your application to here (e.g. "westus2")
        skipCache: true, // (optional) this skips the cache and forces MSAL to get a new token from Azure AD
    };

    return cca.acquireTokenByClientCredential(clientCredentialRequest)

        // .then((response) => {
        //     // Uncomment to see the successful response logged
        //      console.log("Response: ", response);
        //      return response;
        // }).catch((error) => {
        //     // Uncomment to see the errors logges
        //     console.log(JSON.stringify(error));
        //     return error;
        // });
}

/**
 * The code below checks if the script is being executed manually or in automation.
 * If the script was executed manually, it will initialize a ConfidentialClientApplication object
 * and execute the sample client credentials application.
 */
//if(argv.$0 === "index.js") {

function test() {
    const loggerOptions = {
        loggerCallback(loglevel, message, containsPii) {
            console.log(message);
        },
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Verbose,
    }
    
    const authOptions = {
        authOptions: {
            clientId: "aab2db52-824d-474b-b5de-5c9f28cd5137",
            authority: "https://login.microsoftonline.com/common/oauth2/authorize?resource=https://org23e87736.api.crm11.dynamics.com/api/data/v9.2/",
            clientSecret: "BiY8Q~MTkN73kykew~LcLDDdYSNKANxlyExkZcmq",
        }
    }


    // Build MSAL ClientApplication Configuration object
    const clientConfig = {
        auth: authOptions,
        cache: {
            //cachePlugin
        },
        // Uncomment or comment the code below to enable or disable the MSAL logger respectively
        // system: {
        //    loggerOptions,
        // }
    };
    
    // Create msal application object
    const confidentialClientApplication = new msal.ConfidentialClientApplication(clientConfig);

    var x = null;
    getClientCredentialsToken(confidentialClientApplication, null)
    .then((response) => {
            // Uncomment to see the successful response logged
             console.log("Response: ", response);
             x = response;
        }).catch((error) => {
            // Uncomment to see the errors logges
            console.log(JSON.stringify(error));
        });
}
//}

module.exports = {test, test2, getClientCredentialsToken};