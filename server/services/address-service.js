const Wreck = require("@hapi/wreck");
const { httpStatusCode } = require("../lib/constants");
const config = require("../../config/config");
const isEmpty = require("lodash/isEmpty");

const getAPIMAccessToken = async () => {
  const { clientId, clientSecret, grantType, scope, authURL } =
    config.azureAPIManagement;

  const payload = new URLSearchParams();
  payload.append("client_id", clientId);
  payload.append("client_secret", clientSecret);
  payload.append("grant_type", grantType);
  payload.append("scope", scope);

  const options = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    payload: payload.toString(),
  };

  try {
    const { payload } = await Wreck.post(authURL, options);
    const tokenResponse = JSON.parse(payload.toString());
    console.log("Token response: ", tokenResponse);
    return tokenResponse.access_token;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

async function getAddressesByPostcode(postcode) {
  try {
    const token = await getAPIMAccessToken();
    const {authURL} = config.azureAPIManagement;
    if (!isEmpty(token)) {
      const url = `${config.addressLookupBaseUrl}postcodes?postcode=${postcode}`;
      
      const { res, payload } = await Wreck.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("APIM URL: ",url,res.statusCode);
      if (payload && res.statusCode !== httpStatusCode.NO_CONTENT) {
        console.log("Addresses: ",JSON.parse(payload));
        return JSON.parse(payload);
      }
    }else{
      console.log(`Not getting token from ${authURL}`);
    }
    return { results: [] };
  } catch (err) {
    console.error("getAddressesByPostcode error: ",err);
    throw err;
  }
}

module.exports = { getAddressesByPostcode };
