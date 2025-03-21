const Wreck = require("@hapi/wreck");
const { httpStatusCode } = require("../lib/constants");
const config = require("../../config/config");
const { readSecret } = require("../lib/key-vault");
const { getYarValue, setYarValue, sessionKey } = require("../lib/session");
const _ = require("lodash");

const getAPIMAccessToken = async (request) => {
  const clientId = (await readSecret("CLIENT-ID")).value
  const clientSecret = (await readSecret("CLIENT-SECRET")).value
  const grantType = (await readSecret("GRANT-TYPE")).value
  const scope = (await readSecret("SCOPE")).value
  const tenantId = (await readSecret("TENANT-ID")).value
  const authURL = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

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

  console.log(`[APIM_AUTH_REQ_OPTIONS]: ${payload}`);

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
    console.log(`[APIM_ERROR_WHILE_GEN_TOKEN]: ${error}`);
    throw error;
  }
};

const validateAPIMToken = (token) => {
  if (!_.isEmpty(token)) {
    const currentTime = new Date().getTime();

    if (currentTime < token.expiryTime) {
      console.log(`[APIM_TOKEN_FOUND]`);
      return true;
    } else {
      console.log(`[APIM_TOKEN_EXPIRED]`);
      return false;
    }
  } else {
    console.log(`[APIM_TOKEN_EXPIRED]`);
    return false;
  }
};

async function getAddressesByPostcode(postcode, request) {
  const tenantId = await readSecret("TENANT-ID");
  const authURL = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  try {
    let token;
    const sessionAPIM = getYarValue(request, sessionKey.APIM_ACCESS_TOKEN);

    const encodedPostcode = !_.isEmpty(postcode)
      ? encodeURIComponent(postcode.trim())
      : null;

    console.log(`[APIM_ACCESS_TOKEN_FROM_COOKIE]: ${JSON.stringify(sessionAPIM)}`);
    if (!validateAPIMToken(sessionAPIM)) {
      token = await getAPIMAccessToken(request);
    } else {
      token = sessionAPIM.accessToken;
    }

    if (!_.isEmpty(token) && !_.isEmpty(encodedPostcode)) {
      const url = `${config.addressLookupBaseUrl}postcodes?postcode=${encodedPostcode}`;

      const { res, payload } = await Wreck.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`[APIM_GET_ADDRESS_URL]: ${url}`);
      if (payload && res.statusCode !== httpStatusCode.NO_CONTENT) {
        console.log(JSON.parse(payload));
        return JSON.parse(payload);
      }
    } else {
      console.log(`[APIM_TOKEN_NOT_FOUND]: ${authURL}`);
    }
    return { results: [] };
  } catch (err) {
    console.log(`[ERROR_WHILE_FETCHING_ADDRESS]: ${err}`);
    throw err;
  }
}

module.exports = { getAddressesByPostcode };
