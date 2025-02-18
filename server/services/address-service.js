const Wreck = require("@hapi/wreck");
const { httpStatusCode } = require("../lib/constants");
const config = require("../../config/config");
const isEmpty = require("lodash/isEmpty");

const getAPIMAccessToken = async () => {
  const { clientId, clientSecret, grantType, scope, authURL } =
    config.azureAPIManagement;

  const payload = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: grantType,
    scope: scope
  }

  const options = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    payload: new URLSearchParams(payload).toString()
  };

  console.log("AUTH_REQ_OPTIONS ", options)

  try {
    const { payload: response } = await Wreck.post(authURL, options)
    const tokenResponse = JSON.parse(response.toString())
    console.log("TOKEN_RESPONSE ", tokenResponse);
    return tokenResponse.access_token
  } catch (error) {
    console.error("ERROR_WHILE_GEN_TOKEN ", error);
    throw error;
  }
};

async function getAddressesByPostcode(postcode) {
  try {
    const token = await getAPIMAccessToken();
    const { authURL } = config.azureAPIManagement;
    if (!isEmpty(token)) {
      const url = `${config.addressLookupBaseUrl}postcodes?postcode=${postcode}`;

      const { res, payload } = await Wreck.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("APIM_TO_GET_ADDRESS ", url, res.statusCode);
      if (payload && res.statusCode !== httpStatusCode.NO_CONTENT) {
        console.log("Addresses: ", JSON.parse(payload));
        return JSON.parse(payload);
      }
    } else {
      console.log(`TOKEN_NOT_FOUND: ${authURL}`);
    }
    return { results: [] };
  } catch (err) {
    console.error("ERROR_WHILE_FETCHING_ADDRESS ", err);
    throw err;
  }
}

module.exports = { getAddressesByPostcode };
