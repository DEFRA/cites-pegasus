const { httpStatusCode } = require("../lib/constants");
const config = require("../../config/config");
const { readSecret } = require("../lib/key-vault");
const { getYarValue, setYarValue, sessionKey } = require("../lib/session");
const _ = require("lodash");

const getAPIMAccessToken = async (request) => {
  const clientId = await readSecret("CLIENT_ID");
  const clientSecret = await readSecret("CLIENT_SECRET");
  const grantType = await readSecret("GRANT_TYPE");
  const scope = await readSecret("SCOPE");
  const authURL = await readSecret("AUTH_URL");

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
    const { payload } = await Wreck.post(authURL, options);
    const tokenResponse = JSON.parse(payload.toString());

    const data = {
      accessToken: tokenResponse.access_token,
      expiryTime: new Date().getTime() + tokenResponse.expires_in * 1000,
    };

    setYarValue(request, sessionKey.APIM_ACCESS_TOKEN, data);
    console.log("TOKEN_RESPONSE ", data);
    return tokenResponse.access_token;
  } catch (error) {
    console.error("ERROR_WHILE_GEN_TOKEN ", error);
    throw error;
  }
};

const validateAPIMToken = (token) => {
  if (!_.isEmpty(token)) {
    const currentTime = new Date().getTime();

    if (currentTime < token.expiryTime) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

async function getAddressesByPostcode(postcode, request) {
  try {
    const sessionAPIM = getYarValue(request, sessionKey.APIM_ACCESS_TOKEN);

    let token;

    if (!validateAPIMToken(sessionAPIM)) {
      token = await getAPIMAccessToken(request);
    } else {
      token = sessionAPIM.accessToken;
    }

    if (!_.isEmpty(token)) {
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
    }
    return { results: [] };
  } catch (err) {
    console.error("ERROR_WHILE_FETCHING_ADDRESS ", err);
    throw err;
  }
}

module.exports = { getAddressesByPostcode };
