const crypto = require('crypto');

const config = require('config');
const lyftApi = require('../lyft-api');
const {LyftUser} = require('../model');

const ALGORITHM = config.get('crypto.algorithm');
const PASSWORD = config.get('crypto.password');
const CRYPTO_INPUT_ENCODING = 'utf8';
const CRYPTO_OUTPUT_ENCODING = 'base64';

/**
 * Retrieve the access token and stores it.
 * @param {string} code Code returned by the API and sent to the redirect URL.
 * @param {string} state The state object as received from the Lyft API.
 * @return {Promise} A promise that will resolve with the user object.
 */
function handleAuthorizeRedirect(code, state) {
  let auth = null;
  const stateObj = decrypt(state);
  const phone = stateObj.phone;
  return lyftApi
    .handleAuthorizeRedirect(code)
    .then((authInfo) => {
      auth = authInfo;
      return LyftUser.findOne({phone: phone});
    })
    .then((user) => {
      if (user) {
        return updateUserAuth(user, auth);
      }
      return LyftUser.create({
        phone: phone,
        auth: {
          access_token: auth.access_token,
          refresh_token: auth.refresh_token,
          expires_in: auth.expires_in,
          updated_at: Date.now(),
        },
      });
    });
}

/**
 * Updates the user object with the new auth info.
 * @param {LyftUser} user The user record from the db.
 * @param {object} auth The auth object returned from the API.
 * @private
 * @return {Promise} A promise that will resolve with the user object
 * when saved.
 */
function updateUserAuth(user, auth) {
  user.auth.access_token = auth.access_token;
  user.auth.refresh_token = auth.refresh_token;
  user.auth.updated_at = Date.now();
  user.auth.expires_in = auth.expires_in;
  return user.save();
}

/**
 * Returns true if the access token expired.
 * @param {object} auth The auth object stored in the db.
 * @private
 * @return {boolean} True if the access token expired, false otherwise.
 * when saved.
 */
function authExpired(auth) {
  return (Date.now() - auth.updated_at) / 1000 >= auth.expires_in;
}

/**
 * Get user credentials,if they expired refresh them.
 * @param {string} phone The phone number identifying the user.
 * @return {Promise} A promise that will resolve with the auth object.
 */
function getCredentials(phone) {
  return LyftUser.findOne({phone: phone}).then((user) => {
    if (user) {
      const auth = user.auth;
      if (authExpired(auth)) {
        return lyftApi.refreshAccessToken(auth.refresh_token);
      }
      return auth;
    }
    throw new Error();
  });
}

/**
 * Request a new ride.
 * @param {string} phone The phone number identifying the user.
 * @param {string} rideType The ride type (e.g.: lyft, lyft_line, etc).
 * @param {object} origin The ride starting location.
 * @param {object} destination The ride destination.
 * @return {Promise} A promise that will resolve with the ride object.
 */
function requestRide(phone, rideType, origin, destination) {
  return getCredentials(phone).then((auth) => {
    return lyftApi.requestRide(
      auth.access_token,
      rideType,
      origin,
      destination
    );
  });
}

/**
 * Estimate a new ride.
 * @param {string} phone The phone number identifying the user.
 * @param {string} rideType The ride type (e.g.: lyft, lyft_line, etc).
 * @param {object} origin The ride starting location.
 * @param {object} destination The ride destination.
 * @return {Promise} A promise that will resolve with the estimate object.
 */
function estimateRide(phone, rideType, origin, destination) {
  return getCredentials(phone).then((auth) => {
    return lyftApi.estimateRide(
      auth.access_token,
      rideType,
      origin,
      destination
    );
  });
}

/**
 * Encrypt an object using the configured algorithm and password.
 * @param {object} obj The JSON object to stringify and encrypt.
 * @return {string} The encrypted stringified input object.
 */
function encrypt(obj) {
  const cipher = crypto.createCipher(ALGORITHM, PASSWORD);
  let encrypted = cipher.update(
    JSON.stringify(obj),
    CRYPTO_INPUT_ENCODING,
    CRYPTO_OUTPUT_ENCODING
  );
  encrypted += cipher.final(CRYPTO_OUTPUT_ENCODING);
  return encrypted;
}

/**
 * Dencrypt a string into the original JSON object.
 * @param {string} str The encrypted string.
 * @return {object} The decrypted object.
 */
function decrypt(str) {
  const decipher = crypto.createDecipher(ALGORITHM, PASSWORD);
  let decrypted = decipher.update(
    str,
    CRYPTO_OUTPUT_ENCODING,
    CRYPTO_INPUT_ENCODING
  );
  decrypted += decipher.final(CRYPTO_INPUT_ENCODING);
  return JSON.parse(decrypted);
}

module.exports = {
  authorizeUrl(phone) {
    const state = {phone};
    const encryptedState = encrypt(state);
    return lyftApi.authorizeUrl(encryptedState);
  },
  handleAuthorizeRedirect,
  requestRide,
  estimateRide,
  RIDE_TYPES: lyftApi.RIDE_TYPES,
};
