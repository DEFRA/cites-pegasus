const Wreck = require("@hapi/wreck");
const { httpStatusCode } = require("../lib/constants");
const config = require("../../config/config");

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
    return tokenResponse.access_token;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

async function getAddressesByPostcode(postcode) {
  try {
    const token = await getAPIMAccessToken();

    const url = `${config.addressLookupBaseUrl}postcodes?postcode=${postcode}`;

    const { res, payload } = await Wreck.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (payload && res.statusCode !== httpStatusCode.NO_CONTENT) {
      console.log(JSON.parse(payload));
      return JSON.parse(payload);
    }

    return { results: [] };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = { getAddressesByPostcode };
