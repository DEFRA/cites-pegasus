const { httpStatusCode } = require("../lib/constants");
const config = require("../../config/config");
const isEmpty = require("lodash/isEmpty");
const axios = require("axios");

const getAPIMAccessToken = async () => {
  const { clientId, clientSecret, grantType, scope, authURL } =
    config.azureAPIManagement;

  const payload = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: grantType,
    scope: scope,
  };

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  console.log("AUTH_REQ_OPTIONS Payload", payload);

  try {
    const { data } = await axios.post(authURL, payload, { headers: headers });

    console.log("TOKEN_RESPONSE ", data);
    return data.access_token;
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

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(url, { headers: headers });

      console.log("APIM_TO_GET_ADDRESS ", url, response);
      if (response.data && response.statusCode !== httpStatusCode.NO_CONTENT) {
        console.log("Addresses: ", response.data);
        return response.data;
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
