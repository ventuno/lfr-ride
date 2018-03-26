const config = require('config');
const rp = require('request-promise');

const API_BASE_URL = config.get('services.sms-service');
const API_SEND_SMS_PATH = 'sms/send';

/**
 * Send SMS
 * @param {string} phone Phone number to send the SMS to.
 * @param {string} body Content of the SMS to send.
 * @return {Promise} A promise that will resolve when the SMS is sent.
 */
function sendSms(phone, body) {
  const options = {
    method: 'POST',
    uri: `${API_BASE_URL}/${API_SEND_SMS_PATH}`,
    body: {
      to: phone,
      body: body,
    },
    json: true,
  };
  return rp(options).then((body) => {
    console.log(body);
    return body;
  });
}

module.exports = {
  sendSms,
};
