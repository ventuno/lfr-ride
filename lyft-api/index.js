const config = require('config');
const rp = require('request-promise');

const API_BASE_URL = 'https://api.lyft.com';
const CLIENT_ID = config.get('auth.lyft.client_id');
const CLIENT_SECRET = config.get('auth.lyft.client_secret');
const API_SCOPE = 'public%20profile%20rides.read%20rides.request%20offline';
const API_AUTHORIZE_URL = `${API_BASE_URL}/oauth/authorize\
?client_id=${CLIENT_ID}\
&scope=${API_SCOPE}\
&response_type=code\
&state=abc`;
const API_AUTH_PATH = 'oauth/token';
const API_REQUEST_RIDE_PATH = 'v1/rides';
const API_ESTIMATE_RIDE_PATH = 'v1/cost';
const RIDE_TYPES = {
  LYFT: 'lyft',
  LYFT_PLUS: 'lyft_plus',
  LYFT_LINE: 'lyft_line',
  LYFT_PREMIER: 'lyft_premier',
  LYFT_LUX: 'lyft_lux',
  LYFT_LUXSUV: 'lyft_luxsuv',
};

/**
 * Retrieve the access token
 * @param {string} code Code returned by the API and sent to the redirect URL.
 * @return {Promise} A promise that will resolve with the auth object.
 */
function retrieveAccessToken(code) {
  const body = {
    grant_type: 'authorization_code',
    code: code,
  };
  return doAuthPOST(API_AUTH_PATH, body);
}

/**
 * Refresh the access token
 * @param {string} refreshToken Refresh token.
 * @return {Promise} A promise that will resolve with the auth object.
 */
function refreshAccessToken(refreshToken) {
  const body = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  };
  return doAuthPOST(API_AUTH_PATH, body);
}

/**
 * Handles the auth URL.
 * @param {string} code
 * @return {Promise} A promise that will resolve with the auth object.
 */
function handleAuthorizeRedirect(code) {
  return retrieveAccessToken(code);
}

/**
 * Request a new ride.
 * @param {string} accessToken The access token.
 * @param {string} rideType The ride type (e.g.: lyft, lyft_line, etc).
 * @param {object} origin The ride starting location.
 * @param {object} destination The ride destination.
 * @return {Promise} A promise that will resolve with the ride object.
 */
function requestRide(accessToken, rideType, origin, destination) {
  const body = {
    ride_type: rideType,
    origin,
    destination,
  };
  return doAPIPOST(accessToken, API_REQUEST_RIDE_PATH, body);
}

/**
 * Estimate a new ride.
 * @param {string} accessToken The access token.
 * @param {string} rideType The ride type (e.g.: lyft, lyft_line, etc).
 * @param {object} origin The ride starting location.
 * @param {object} destination The ride destination.
 * @return {Promise} A promise that will resolve with the ride object.
 */
function estimateRide(accessToken, rideType, origin, destination) {
  const query = {
    ride_type: rideType,
    start_lat: origin.lat,
    start_lng: origin.lng,
    end_lat: destination.lat,
    end_lng: destination.lng,
  };
  return doAPIGET(accessToken, API_ESTIMATE_RIDE_PATH, query);
}

/**
 * Generic Auth POST request.
 * @param {string} path URL path.
 * @param {object} body Request body.
 * @return {Promise} A promise that will resolve with the response body.
 */
function doAuthPOST(path, body) {
  const options = {
    method: 'POST',
    auth: {
      user: CLIENT_ID,
      pass: CLIENT_SECRET,
    },
    uri: `${API_BASE_URL}/${path}`,
    body: body,
    json: true,
  };
  return rp(options).then((body) => {
    console.log(body);
    return body;
  });
}

/**
 * Generic API POST request.
 * @param {string} accessToken The access token.
 * @param {string} path The URL path.
 * @param {string} body The data associated with the request.
 * @return {Promise} A promise that will resolve with the response body.
 */
function doAPIPOST(accessToken, path, body) {
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    uri: `${API_BASE_URL}/${path}`,
    body: body,
    json: true,
  };
  return rp(options).then((body) => {
    console.log(body);
    return body;
  });
}

/**
 * Generic API GET request.
 * @param {string} accessToken The access token.
 * @param {string} path The URL path.
 * @param {string} query The data associated with the request.
 * @return {Promise} A promise that will resolve with the response body.
 */
function doAPIGET(accessToken, path, query) {
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    uri: `${API_BASE_URL}/${path}`,
    qs: query,
    json: true,
  };
  return rp(options).then((body) => {
    console.log(body);
    return body;
  });
}

module.exports = {
  authorizeUrl() {
    return API_AUTHORIZE_URL;
  },
  handleAuthorizeRedirect,
  refreshAccessToken,
  requestRide,
  estimateRide,
  RIDE_TYPES,
};
